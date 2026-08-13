---
title: Attention
subtitle: How a model lets each word look at the others, and why the formula divides by a square root.
date: 2026-08-13
tags: llm
icon: 🍵
---

I want to explain attention, which is the mechanism that made modern language
models possible. If you have read anything about how these models work you
will have seen the word, and probably the formula, and possibly a diagram with
arrows in it. What I would like to do here is slower than that. I want to
start from the problem attention was invented to solve, build the mechanism up
one piece at a time, and finish somewhere you might not expect: with an
explanation of why there is a square root in the denominator, which I think is
the most quietly interesting detail in the whole design.

I am going to assume you know nothing about neural networks. If you know a
great deal, the first two sections will be familiar and you can skim them.

[TOC]

## The Problem, Which Is About Sentences and Not About Machines

Here is the difficulty, and it has nothing to do with computers.

The meaning of a word depends on the other words around it. In "the cat sat on
the mat", the word "sat" is doing something that involves the cat, and the word
"the" appears twice while pointing at two different things. If I asked you what
"it" refers to in "the trophy did not fit in the suitcase because it was too
big", you would have to weigh up two candidates and pick one, and you would use
the rest of the sentence to do it.

So a machine that processes language needs some way for each word to take
account of the others. The question is which others, and how much.

The obvious answers are both bad. You could let every word simply average all
the others, but then "cat" contributes exactly as much to "sat" as "the" does,
which is plainly wrong. Or you could fix the pattern in advance — always look
at the previous three words, say — but the words that matter are not at a fixed
distance. In "the trophy did not fit in the suitcase because it was too big",
the word "it" needs "trophy", which is nine words back.

What we want is for the model to *decide*, for each word, which other words to
draw on, and by how much. And we want it to learn how to make that decision
from data, rather than being told. That is what attention does.

<div class='sketch'>
    <svg viewBox='0 0 720 208' role='img' aria-label='Two ways to translate. On the left four source words funnel into a single vector and the output is written from that alone. On the right every output word is joined directly to every source word.'>
      <text class='sk-lbl' x='12.0' y='22.0' text-anchor='start'>before 2014</text>
      <path class='sk-s2' d='M21.5,38.7 Q52.9,37.8 84.2,38.7 Q92.2,38.7 92.2,46.7 Q92.9,51.8 92.2,56.8 Q92.2,64.8 84.2,64.8 Q52.9,64.5 21.5,64.8 Q13.5,64.8 13.5,56.8 Q12.6,51.8 13.5,46.7 Q13.5,38.7 21.5,38.7'/>
      <path class='sk-s2' d='M21.2,38.9 Q53.0,38.8 84.9,38.9 Q92.9,38.9 92.9,46.9 Q92.9,51.5 92.9,56.1 Q92.9,64.1 84.9,64.1 Q53.0,64.3 21.2,64.1 Q13.2,64.1 13.2,56.1 Q13.8,51.5 13.2,46.9 Q13.2,38.9 21.2,38.9'/>
      <text class='sk-t' x='53.0' y='56.0' text-anchor='middle'>L'accord</text>
      <path class='sk-thin' d='M92.4,50.9 Q122.4,75.4 152.0,100.5'/>
      <path class='sk-thin' d='M92.0,50.4 Q122.4,75.2 152.3,100.5'/>
      <path class='sk-s2' d='M21.4,72.9 Q52.4,72.8 83.3,72.9 Q91.3,72.9 91.3,80.9 Q90.5,85.4 91.3,89.9 Q91.3,97.9 83.3,97.9 Q52.4,97.1 21.4,97.9 Q13.4,97.9 13.4,89.9 Q13.7,85.4 13.4,80.9 Q13.4,72.9 21.4,72.9'/>
      <path class='sk-s2' d='M22.5,71.3 Q53.3,70.8 84.2,71.3 Q92.2,71.3 92.2,79.3 Q92.4,85.0 92.2,90.8 Q92.2,98.8 84.2,98.8 Q53.3,98.5 22.5,98.8 Q14.5,98.8 14.5,90.8 Q14.1,85.0 14.5,79.3 Q14.5,71.3 22.5,71.3'/>
      <text class='sk-t' x='53.0' y='90.0' text-anchor='middle'>sur</text>
      <path class='sk-thin' d='M92.0,85.3 Q121.7,93.3 151.7,99.5'/>
      <path class='sk-thin' d='M92.2,84.8 Q122.6,91.7 152.7,100.0'/>
      <path class='sk-s2' d='M21.6,106.8 Q52.9,106.1 84.2,106.8 Q92.2,106.8 92.2,114.8 Q92.0,119.4 92.2,124.0 Q92.2,132.0 84.2,132.0 Q52.9,131.3 21.6,132.0 Q13.6,132.0 13.6,124.0 Q12.6,119.4 13.6,114.8 Q13.6,106.8 21.6,106.8'/>
      <path class='sk-s2' d='M22.3,106.5 Q52.9,107.0 83.4,106.5 Q91.4,106.5 91.4,114.5 Q92.1,119.3 91.4,124.1 Q91.4,132.1 83.4,132.1 Q52.9,131.8 22.3,132.1 Q14.3,132.1 14.3,124.1 Q14.2,119.3 14.3,114.5 Q14.3,106.5 22.3,106.5'/>
      <text class='sk-t' x='53.0' y='124.0' text-anchor='middle'>la</text>
      <path class='sk-thin' d='M92.2,119.5 Q122.3,110.4 152.0,100.0'/>
      <path class='sk-thin' d='M92.6,118.8 Q122.4,108.7 152.5,99.6'/>
      <path class='sk-s2' d='M22.8,140.4 Q53.1,140.0 83.5,140.4 Q91.5,140.4 91.5,148.4 Q92.1,152.8 91.5,157.2 Q91.5,165.2 83.5,165.2 Q53.1,165.7 22.8,165.2 Q14.8,165.2 14.8,157.2 Q14.2,152.8 14.8,148.4 Q14.8,140.4 22.8,140.4'/>
      <path class='sk-s2' d='M22.0,140.5 Q52.9,140.2 83.9,140.5 Q91.9,140.5 91.9,148.5 Q91.3,153.1 91.9,157.7 Q91.9,165.7 83.9,165.7 Q52.9,166.4 22.0,165.7 Q14.0,165.7 14.0,157.7 Q13.4,153.1 14.0,148.5 Q14.0,140.5 22.0,140.5'/>
      <text class='sk-t' x='53.0' y='158.0' text-anchor='middle'>zone</text>
      <path class='sk-thin' d='M92.3,153.3 Q122.1,126.5 151.9,99.7'/>
      <path class='sk-thin' d='M91.8,152.4 Q122.2,126.6 151.8,100.0'/>
      <path class='sk-mark' d='M160.7,86.5 Q190.1,86.7 219.5,86.5 Q227.5,86.5 227.5,94.5 Q226.7,100.4 227.5,106.3 Q227.5,114.3 219.5,114.3 Q190.1,114.8 160.7,114.3 Q152.7,114.3 152.7,106.3 Q153.3,100.4 152.7,94.5 Q152.7,86.5 160.7,86.5'/>
      <path class='sk-mark' d='M160.1,86.6 Q189.7,86.5 219.2,86.6 Q227.2,86.6 227.2,94.6 Q228.2,100.5 227.2,106.4 Q227.2,114.4 219.2,114.4 Q189.7,115.3 160.1,114.4 Q152.1,114.4 152.1,106.4 Q151.5,100.5 152.1,94.6 Q152.1,86.6 160.1,86.6'/>
      <text class='sk-t' x='190.0' y='105.0' text-anchor='middle'>one vector</text>
      <path class='sk-thin' d='M227.7,100.5 Q245.7,88.5 262.4,74.7'/>
      <path class='sk-thin' d='M227.3,100.5 Q244.1,87.1 261.6,74.7'/>
      <path class='sk-thin' d='M262.6,74.5 Q261.2,77.6 259.6,80.6'/>
      <path class='sk-thin' d='M261.6,73.3 Q257.9,73.5 254.4,74.3'/>
      <path class='sk-thin' d='M227.4,99.8 Q245.2,112.7 262.0,126.7'/>
      <path class='sk-thin' d='M228.1,100.0 Q245.6,112.2 261.9,126.1'/>
      <path class='sk-thin' d='M262.2,125.6 Q258.6,125.0 255.0,124.8'/>
      <path class='sk-thin' d='M262.3,125.9 Q260.3,123.2 258.9,120.1'/>
      <path class='sk-s3' d='M270.2,59.4 Q304.4,59.7 338.6,59.4 Q346.6,59.4 346.6,67.4 Q346.5,73.6 346.6,79.8 Q346.6,87.8 338.6,87.8 Q304.4,87.3 270.2,87.8 Q262.2,87.8 262.2,79.8 Q261.8,73.6 262.2,67.4 Q262.2,59.4 270.2,59.4'/>
      <path class='sk-s3' d='M270.3,59.6 Q303.7,59.8 337.1,59.6 Q345.1,59.6 345.1,67.6 Q345.3,74.1 345.1,80.5 Q345.1,88.5 337.1,88.5 Q303.7,89.0 270.3,88.5 Q262.3,88.5 262.3,80.5 Q262.4,74.1 262.3,67.6 Q262.3,59.6 270.3,59.6'/>
      <text class='sk-t' x='304.0' y='79.0' text-anchor='middle'>The</text>
      <path class='sk-s3' d='M269.6,111.5 Q304.2,110.5 338.8,111.5 Q346.8,111.5 346.8,119.5 Q346.5,126.0 346.8,132.5 Q346.8,140.5 338.8,140.5 Q304.2,140.6 269.6,140.5 Q261.6,140.5 261.6,132.5 Q260.7,126.0 261.6,119.5 Q261.6,111.5 269.6,111.5'/>
      <path class='sk-s3' d='M270.0,112.7 Q304.0,111.8 337.9,112.7 Q345.9,112.7 345.9,120.7 Q346.8,126.7 345.9,132.8 Q345.9,140.8 337.9,140.8 Q304.0,140.2 270.0,140.8 Q262.0,140.8 262.0,132.8 Q261.9,126.7 262.0,120.7 Q262.0,112.7 270.0,112.7'/>
      <text class='sk-t' x='304.0' y='131.0' text-anchor='middle'>agreement</text>
      <text class='sk-note' x='180.0' y='188.0' text-anchor='middle'>the whole sentence, through one gap</text>
      <path class='sk-faint' d='M372.6,25.6 Q372.5,111.1 371.5,196.6'/>
      <text class='sk-lbl' x='396.0' y='22.0' text-anchor='start'>after 2014</text>
      <path class='sk-s2' d='M405.7,37.2 Q436.9,37.5 468.1,37.2 Q476.1,37.2 476.1,45.2 Q476.9,50.3 476.1,55.4 Q476.1,63.4 468.1,63.4 Q436.9,63.3 405.7,63.4 Q397.7,63.4 397.7,55.4 Q396.8,50.3 397.7,45.2 Q397.7,37.2 405.7,37.2'/>
      <path class='sk-s2' d='M406.7,37.9 Q436.9,38.4 467.1,37.9 Q475.1,37.9 475.1,45.9 Q474.7,51.0 475.1,56.0 Q475.1,64.0 467.1,64.0 Q436.9,63.8 406.7,64.0 Q398.7,64.0 398.7,56.0 Q398.8,51.0 398.7,45.9 Q398.7,37.9 406.7,37.9'/>
      <text class='sk-t' x='437.0' y='56.0' text-anchor='middle'>L'accord</text>
      <path class='sk-s2' d='M406.7,72.9 Q437.4,71.9 468.2,72.9 Q476.2,72.9 476.2,80.9 Q475.6,85.1 476.2,89.3 Q476.2,97.3 468.2,97.3 Q437.4,98.2 406.7,97.3 Q398.7,97.3 398.7,89.3 Q398.8,85.1 398.7,80.9 Q398.7,72.9 406.7,72.9'/>
      <path class='sk-s2' d='M406.6,72.3 Q437.5,72.7 468.4,72.3 Q476.4,72.3 476.4,80.3 Q475.9,84.9 476.4,89.4 Q476.4,97.4 468.4,97.4 Q437.5,96.5 406.6,97.4 Q398.6,97.4 398.6,89.4 Q399.4,84.9 398.6,80.3 Q398.6,72.3 406.6,72.3'/>
      <text class='sk-t' x='437.0' y='90.0' text-anchor='middle'>sur</text>
      <path class='sk-s2' d='M406.1,105.8 Q437.4,105.9 468.7,105.8 Q476.7,105.8 476.7,113.8 Q475.7,119.2 476.7,124.6 Q476.7,132.6 468.7,132.6 Q437.4,132.4 406.1,132.6 Q398.1,132.6 398.1,124.6 Q398.8,119.2 398.1,113.8 Q398.1,105.8 406.1,105.8'/>
      <path class='sk-s2' d='M406.7,106.5 Q437.2,105.5 467.6,106.5 Q475.6,106.5 475.6,114.5 Q476.6,119.7 475.6,124.9 Q475.6,132.9 467.6,132.9 Q437.2,132.3 406.7,132.9 Q398.7,132.9 398.7,124.9 Q398.8,119.7 398.7,114.5 Q398.7,106.5 406.7,106.5'/>
      <text class='sk-t' x='437.0' y='124.0' text-anchor='middle'>la</text>
      <path class='sk-s2' d='M406.7,139.8 Q437.5,140.5 468.3,139.8 Q476.3,139.8 476.3,147.8 Q476.2,153.1 476.3,158.4 Q476.3,166.4 468.3,166.4 Q437.5,165.9 406.7,166.4 Q398.7,166.4 398.7,158.4 Q398.2,153.1 398.7,147.8 Q398.7,139.8 406.7,139.8'/>
      <path class='sk-s2' d='M405.8,139.8 Q437.1,139.6 468.4,139.8 Q476.4,139.8 476.4,147.8 Q475.6,153.2 476.4,158.6 Q476.4,166.6 468.4,166.6 Q437.1,167.1 405.8,166.6 Q397.8,166.6 397.8,158.6 Q397.6,153.2 397.8,147.8 Q397.8,139.8 405.8,139.8'/>
      <text class='sk-t' x='437.0' y='158.0' text-anchor='middle'>zone</text>
      <path class='sk-att' d='M476.2,51.4 Q535.8,63.6 595.5,74.5'/>
      <path class='sk-att' d='M476.0,50.9 Q535.9,61.7 595.8,73.4'/>
      <path class='sk-att' d='M475.9,50.6 Q535.7,88.7 596.3,125.4'/>
      <path class='sk-att' d='M476.7,51.3 Q535.5,89.5 595.3,126.2'/>
      <path class='sk-att' d='M475.5,85.4 Q535.6,78.8 595.8,73.8'/>
      <path class='sk-att' d='M476.4,84.8 Q535.9,79.1 595.3,73.9'/>
      <path class='sk-att' d='M476.0,85.5 Q536.2,104.9 595.7,126.3'/>
      <path class='sk-att' d='M476.1,85.0 Q536.3,104.7 596.1,125.6'/>
      <path class='sk-att' d='M475.9,119.6 Q536.2,96.5 596.5,73.7'/>
      <path class='sk-att' d='M475.6,118.6 Q536.2,97.4 596.3,74.5'/>
      <path class='sk-att' d='M476.4,119.7 Q535.9,123.5 595.5,126.3'/>
      <path class='sk-att' d='M475.8,118.6 Q536.1,121.8 596.3,126.6'/>
      <path class='sk-att' d='M476.0,152.6 Q535.7,112.6 595.9,73.4'/>
      <path class='sk-att' d='M475.7,153.6 Q535.9,114.2 595.3,73.7'/>
      <path class='sk-att' d='M476.0,152.8 Q535.9,138.9 596.1,126.4'/>
      <path class='sk-att' d='M476.2,153.3 Q535.9,138.5 596.0,125.3'/>
      <path class='sk-s3' d='M604.8,60.4 Q650.1,60.0 695.3,60.4 Q703.3,60.4 703.3,68.4 Q704.0,74.1 703.3,79.9 Q703.3,87.9 695.3,87.9 Q650.1,88.5 604.8,87.9 Q596.8,87.9 596.8,79.9 Q595.8,74.1 596.8,68.4 Q596.8,60.4 604.8,60.4'/>
      <path class='sk-s3' d='M603.6,59.6 Q650.2,59.2 696.8,59.6 Q704.8,59.6 704.8,67.6 Q704.5,73.6 704.8,79.6 Q704.8,87.6 696.8,87.6 Q650.2,86.7 603.6,87.6 Q595.6,87.6 595.6,79.6 Q595.8,73.6 595.6,67.6 Q595.6,59.6 603.6,59.6'/>
      <text class='sk-t' x='650.0' y='79.0' text-anchor='middle'>The</text>
      <path class='sk-s3' d='M604.2,111.9 Q650.5,111.3 696.9,111.9 Q704.9,111.9 704.9,119.9 Q704.7,125.9 704.9,131.8 Q704.9,139.8 696.9,139.8 Q650.5,138.9 604.2,139.8 Q596.2,139.8 596.2,131.8 Q597.0,125.9 596.2,119.9 Q596.2,111.9 604.2,111.9'/>
      <path class='sk-s3' d='M604.7,112.0 Q650.2,112.9 695.7,112.0 Q703.7,112.0 703.7,120.0 Q704.4,125.7 703.7,131.4 Q703.7,139.4 695.7,139.4 Q650.2,138.9 604.7,139.4 Q596.7,139.4 596.7,131.4 Q596.6,125.7 596.7,120.0 Q596.7,112.0 604.7,112.0'/>
      <text class='sk-t' x='650.0' y='131.0' text-anchor='middle'>agreement</text>
      <text class='sk-note' x='556.0' y='188.0' text-anchor='middle'>each word picks its own blend</text>
    </svg>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        The change that started all of this. On the left, a translator
        squeezes the whole source sentence through one fixed vector and writes
        its output from that alone, which is why long sentences went so badly.
        On the right, each output word reaches back to every source word and
        takes its own weighted blend of them. I have drawn only four source
        words here; imagine forty, and you can feel the left-hand design
        straining.
    </div>
</div>

## 1. Four Steps From a Translation Bug to Every Model You Have Heard Of

The idea arrived in 2014, and not as a grand theory. It was a fix for a
specific, visible failure.

<div class='roadmap'>
    <svg viewBox='0 0 760 192' role='img' aria-label='Roadmap of attention: a fix for a bottleneck in 2014, a simpler score in 2015, the recurrence dropped in 2017, and the transformer everywhere after.'>
      <path class='spine' d='M94.2,51.8 Q380.2,51.3 666.1,51.4'/>
      <path class='head' d='M178.3,51.7 Q189.3,51.5 200.3,51.7'/>
      <path class='head' d='M178.2,52.4 Q189.6,51.6 201.0,51.7'/>
      <path class='head' d='M200.9,51.6 Q198.5,53.5 195.6,54.7'/>
      <path class='head' d='M199.8,51.6 Q197.6,50.2 195.2,49.4'/>
      <text class='why' x='189.5' y='27.0'>the scoring network was extra</text>
      <text class='why' x='189.5' y='39.0'>machinery</text>
      <path class='head' d='M368.5,52.4 Q379.4,52.6 390.4,52.0'/>
      <path class='head' d='M369.3,52.2 Q379.9,51.7 390.5,51.4'/>
      <path class='head' d='M391.7,51.9 Q389.1,53.8 386.4,55.7'/>
      <path class='head' d='M391.1,51.5 Q388.4,49.9 385.8,48.3'/>
      <text class='why' x='380.0' y='27.0'>attention was fine; the</text>
      <text class='why' x='380.0' y='39.0'>recurrence was not</text>
      <path class='head' d='M559.7,51.6 Q570.9,52.4 582.2,52.3'/>
      <path class='head' d='M559.2,52.4 Q570.5,52.6 581.8,52.6'/>
      <path class='head' d='M581.6,51.6 Q578.6,53.4 575.8,55.3'/>
      <path class='head' d='M581.2,51.6 Q579.2,49.9 576.9,48.5'/>
      <text class='why' x='570.5' y='27.0'>quadratic cost, and a cache to</text>
      <text class='why' x='570.5' y='39.0'>feed</text>
      <g class='stop'>
        <rect class='hit' x='6.0' y='42.0' width='176.5' height='140.0'/>
        <circle class='dot' cx='94.2' cy='52.0' r='4.5'/>
        <path class='box' d='M13.2,67.9 Q94.3,67.7 175.3,67.9 Q182.3,67.9 182.3,74.9 Q181.7,125.6 182.3,176.4 Q182.3,183.4 175.3,183.4 Q94.3,182.8 13.2,183.4 Q6.2,183.4 6.2,176.4 Q6.8,125.6 6.2,74.9 Q6.2,67.9 13.2,67.9'/>
        <path class='box' d='M13.1,68.6 Q94.2,68.3 175.3,68.6 Q182.3,68.6 182.3,75.6 Q181.9,126.5 182.3,177.5 Q182.3,184.5 175.3,184.5 Q94.2,185.4 13.1,184.5 Q6.1,184.5 6.1,177.5 Q6.2,126.5 6.1,75.6 Q6.1,68.6 13.1,68.6'/>
        <text class='yr' x='94.2' y='77.0'>2014</text>
        <text class='stage' x='94.2' y='91.0'>a fix for a bottleneck</text>
        <text class='body' x='94.2' y='109.0'>Bahdanau et al. let a</text>
        <text class='body' x='94.2' y='123.5'>translator look back at</text>
        <text class='body' x='94.2' y='138.0'>every source word instead</text>
        <text class='body' x='94.2' y='152.5'>of squeezing the sentence</text>
        <text class='body' x='94.2' y='167.0'>into one vector.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='196.5' y='42.0' width='176.5' height='140.0'/>
        <circle class='dot' cx='284.8' cy='52.0' r='4.5'/>
        <path class='box' d='M202.8,68.6 Q284.5,68.0 366.2,68.6 Q373.2,68.6 373.2,75.6 Q374.1,126.0 373.2,176.4 Q373.2,183.4 366.2,183.4 Q284.5,182.9 202.8,183.4 Q195.8,183.4 195.8,176.4 Q194.9,126.0 195.8,75.6 Q195.8,68.6 202.8,68.6'/>
        <path class='box' d='M203.9,68.8 Q284.7,69.2 365.5,68.8 Q372.5,68.8 372.5,75.8 Q373.0,126.6 372.5,177.4 Q372.5,184.4 365.5,184.4 Q284.7,184.4 203.9,184.4 Q196.9,184.4 196.9,177.4 Q196.1,126.6 196.9,75.8 Q196.9,68.8 203.9,68.8'/>
        <text class='yr' x='284.8' y='77.0'>2015</text>
        <text class='stage' x='284.8' y='91.0'>the score gets simpler</text>
        <text class='body' x='284.8' y='109.0'>Luong et al. replace the</text>
        <text class='body' x='284.8' y='123.5'>small alignment network</text>
        <text class='body' x='284.8' y='138.0'>with a plain dot product.</text>
        <text class='body' x='284.8' y='152.5'>Cheaper, and the form still</text>
        <text class='body' x='284.8' y='167.0'>used today.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='387.0' y='42.0' width='176.5' height='140.0'/>
        <circle class='dot' cx='475.2' cy='52.0' r='4.5'/>
        <path class='box' d='M394.8,67.3 Q475.7,66.9 556.6,67.3 Q563.6,67.3 563.6,74.3 Q563.2,125.6 563.6,176.8 Q563.6,183.8 556.6,183.8 Q475.7,184.5 394.8,183.8 Q387.8,183.8 387.8,176.8 Q387.3,125.6 387.8,74.3 Q387.8,67.3 394.8,67.3'/>
        <path class='box' d='M393.5,67.4 Q474.8,68.0 556.1,67.4 Q563.1,67.4 563.1,74.4 Q562.3,125.6 563.1,176.7 Q563.1,183.7 556.1,183.7 Q474.8,182.7 393.5,183.7 Q386.5,183.7 386.5,176.7 Q385.9,125.6 386.5,74.4 Q386.5,67.4 393.5,67.4'/>
        <text class='yr' x='475.2' y='77.0'>2017</text>
        <text class='stage' x='475.2' y='91.0'>drop the recurrence</text>
        <text class='body' x='475.2' y='109.0'>Vaswani et al. keep only</text>
        <text class='body' x='475.2' y='123.5'>attention, pointed at the</text>
        <text class='body' x='475.2' y='138.0'>sequence itself. Multiple</text>
        <text class='body' x='475.2' y='152.5'>heads, and the division by</text>
        <text class='body' x='475.2' y='167.0'>the square root of the</text>
        <text class='body' x='475.2' y='181.5'>width.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='577.5' y='42.0' width='176.5' height='140.0'/>
        <circle class='dot' cx='665.8' cy='52.0' r='4.5'/>
        <path class='box' d='M583.8,68.4 Q665.8,67.4 747.7,68.4 Q754.7,68.4 754.7,75.4 Q754.4,126.3 754.7,177.3 Q754.7,184.3 747.7,184.3 Q665.8,184.9 583.8,184.3 Q576.8,184.3 576.8,177.3 Q576.3,126.3 576.8,75.4 Q576.8,68.4 583.8,68.4'/>
        <path class='box' d='M585.3,67.8 Q666.2,68.1 747.1,67.8 Q754.1,67.8 754.1,74.8 Q753.6,125.5 754.1,176.2 Q754.1,183.2 747.1,183.2 Q666.2,183.8 585.3,183.2 Q578.3,183.2 578.3,176.2 Q578.9,125.5 578.3,74.8 Q578.3,67.8 585.3,67.8'/>
        <text class='yr' x='665.8' y='77.0'>2018-</text>
        <text class='stage' x='665.8' y='91.0'>everything is a transformer</text>
        <text class='body' x='665.8' y='109.0'>BERT and GPT build on it.</text>
        <text class='body' x='665.8' y='123.5'>By the 2020s, hybrids swap</text>
        <text class='body' x='665.8' y='138.0'>some attention layers out</text>
        <text class='body' x='665.8' y='152.5'>again to shrink what it</text>
        <text class='body' x='665.8' y='167.0'>must store.</text>
      </g>
    </svg>
</div>

I want to say more about that first box, because the failure is easy to
picture. Machine translation at the time worked by having one network read the
source sentence and compress it into a single fixed-length vector, and a second
network write the translation out of that vector. Everything the first network
understood had to fit through that one bottleneck. It worked for short
sentences and fell apart on long ones, which is exactly what you would expect
if you had to summarise a paragraph in a fixed number of syllables and then
reconstruct it from the summary.

Bahdanau, Cho and Bengio proposed that the writing network should not be
restricted to the summary. At each word it produced, it could look back over
*all* of the source words and take a weighted blend of them, with the weights
computed fresh each time. The bottleneck disappears, because there is no longer
one vector that has to hold everything.

There is one thing the third arrow says that I should make good on. It
mentions "a cache to feed", which is a consequence of dropping the recurrence
that nobody planned: because attention looks back at every earlier token, a
model generating text ends up storing the keys and values of everything it has
already said. That store is the KV cache, and it turns out to be the dominant
cost of running these models. I have written about
[what it is](/blog/2026/08/13/kv-cache/) and
[what it costs](/blog/2026/08/13/kv-cache-costs/) separately, because it is a
large subject and this post has a different job.

The step I find most striking is the third one. For three years attention was
an accessory bolted onto a recurrent network, which read the sentence one word
at a time. In 2017 Vaswani and colleagues asked what would happen if you
removed the recurrent network and kept only the attention. The answer was that
it worked better, and — because attention looks at all positions at once rather
than walking through them in order — it could be trained on many more words in
parallel. That is the transformer, and essentially every language model you
have heard of is built from it, including the recent hybrid designs that
replace some of its attention layers with cheaper alternatives.

## 2. What Each Word Asks, Offers, and Hands Over

Now let me build the mechanism. I will do it in four steps, and I will not use
the formula until the end.

**Step one: every word becomes a list of numbers.** Before anything else, each
token — a token is a chunk of text, roughly a word — is turned into a
**vector**, which is nothing more frightening than an ordered list of numbers,
perhaps 4,096 of them. You can think
of that list as coordinates: words used in similar ways end up with similar
coordinates. Nothing in this post depends on how those coordinates are learned.

**Step two: each word produces three different vectors, not one.** This is the
part that looks arbitrary when you first meet it, so let me describe what each
one is for before I give it a name.

The first vector describes what this word is *looking for*. In our trophy
sentence, the word "it" is looking for something that could plausibly be a
large object mentioned earlier.

The second vector advertises what this word *has to offer*, so that other words
can judge whether it is what they need. "Trophy" advertises that it is a
concrete object.

The third vector is the *content* that gets handed over if the offer is
accepted.

These three are called the **query**, the **key**, and the **value**. The names
are borrowed from databases, where you look something up by matching a query
against a key and receiving back a value. Each is produced from the word's
original vector by multiplying it by a matrix of learned numbers, and those
three matrices are among the things the model learns during training.

An analogy, as long as you do not lean on it too hard. Imagine every word pins
a small notice to a board describing itself; that notice is its key. Every word
also walks along the board carrying a description of what it wants; that is its
query. Where a query matches a notice, the word takes a copy of what is behind
that notice, which is the value. A word that matches several notices takes some
of each, in proportion to how well each one matched.

**Step three: score every pair.** To find out how well a query matches a key,
we take their **dot product**: multiply the two lists together entry by entry
and add up the results. That gives us one number per pair. It comes out large
when the two vectors point in similar directions, and larger still when the
vectors themselves are long — and I want to flag that second half now, because
it is the seed of the whole of section 4.

**Step four: turn the scores into weights, and average.** The scores can come
out any size, positive or negative, and what we need is proportions. So we
push them through a function called the **softmax**, which raises $e$ to the
power of each score and then divides by the total. Everything that comes out is positive, and the results add up to
one, which is precisely what lets us treat them as proportions of a blend. Then
we use those proportions to average the value vectors together.

That is the whole mechanism. Written down, with $q$ the current word's query,
$K$ all the keys stacked up, and $V$ all the values:

$$
\text{Attention}(q, K, V) = \text{softmax}\!\left(\frac{q K^{\top}}{\sqrt{d}}\right) V .
$$

Read it right to left if the notation is unfamiliar. $qK^{\top}$ is step three,
every score at once. The softmax is step four. Multiplying by $V$ is the
weighted average. The $\sqrt{d}$ in the denominator is the one thing I have not
explained, and section 4 is entirely about it.

<div class='knob'>
    <svg viewBox='0 0 720 300' id='qkv-svg' role='img'
         aria-label='An interactive sentence. Choosing one word as the query shows the dot product it forms with every other word, and the attention weights that come out of the softmax.'>
        <g id='qkv-scene'></g>
    </svg>
    <div class='controls'>
        <label for='qkv-q'>which word is asking</label>
        <input type='range' id='qkv-q' min='0' max='9' value='9' step='1'>
        <span class='readout' id='qkv-q-out'></span>
    </div>
    <div class='controls'>
        <label for='qkv-t'>how sharply it chooses</label>
        <input type='range' id='qkv-t' min='20' max='300' value='100'>
        <span class='readout' id='qkv-t-out'></span>
    </div>
    <p class='note' id='qkv-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 2.</span>
    A sentence, with one word chosen to be the one asking. The bars are the
    <span style='color:#8C77BC'><b>attention weights</b></span> that word puts
    on each of the others, and I have computed them here in your browser from
    the little query and key vectors drawn underneath — this is the real
    arithmetic, not a mock-up. Slide the second control to see the softmax
    change its mind about how decisive to be.
</div>

<script>
(function () {
  var scene = document.getElementById('qkv-scene'),
      qR = document.getElementById('qkv-q'), tR = document.getElementById('qkv-t'),
      qOut = document.getElementById('qkv-q-out'), tOut = document.getElementById('qkv-t-out'),
      note = document.getElementById('qkv-note');
  var W = ['the', 'trophy', 'did', 'not', 'fit', 'in', 'the', 'suitcase', 'because', 'it'];
  // Hand-picked 4-dimensional keys and queries. They are made up, but the
  // arithmetic done with them below is genuine, and they are chosen so the
  // pronoun "it" leans towards the two nouns, which is the point being made.
  var K = [[0.1, 0.2, -0.3, 0.1], [0.9, 0.8, 0.1, -0.2], [-0.2, 0.1, 0.4, 0.2],
           [-0.3, -0.1, 0.5, 0.1], [0.1, -0.2, 0.7, 0.3], [-0.1, 0.1, 0.2, -0.4],
           [0.1, 0.2, -0.3, 0.1], [0.8, 0.6, 0.0, 0.3], [-0.2, 0.0, 0.3, 0.6],
           [0.3, 0.4, -0.1, 0.2]];
  var Q = [[0.2, 0.1, 0.0, 0.1], [0.3, 0.2, 0.4, 0.0], [0.1, 0.0, 0.5, 0.2],
           [0.0, 0.1, 0.6, 0.1], [0.4, 0.3, 0.2, 0.1], [0.2, 0.1, 0.1, 0.3],
           [0.2, 0.1, 0.0, 0.1], [0.3, 0.3, 0.1, 0.2], [0.1, 0.2, 0.2, 0.4],
           [0.95, 0.85, -0.1, 0.15]];
  var N = W.length, X0 = 30, CW = 66;

  function draw() {
    var qi = +qR.value, sharp = +tR.value / 100, s = '', i, j;
    var scores = [], p = [], sum = 0;
    for (i = 0; i < N; i++) {
      var d = 0;
      for (j = 0; j < 4; j++) { d += Q[qi][j] * K[i][j]; }
      scores.push(d / Math.sqrt(4) * sharp);
    }
    var m = Math.max.apply(null, scores);
    for (i = 0; i < N; i++) { p.push(Math.exp(scores[i] - m)); sum += p[i]; }
    for (i = 0; i < N; i++) { p[i] /= sum; }

    s += "<text class='gl' x='" + X0 + "' y='22'>the sentence, one column per word</text>";
    for (i = 0; i < N; i++) {
      var x = X0 + i * CW, isq = i === qi;
      s += "<rect class='cell " + (isq ? 'fresh' : 'kept') + "' x='" + x + "' y='32' width='" +
           (CW - 8) + "' height='24' rx='3'/>";
      s += "<text class='tk' x='" + (x + (CW - 8) / 2) + "' y='48' text-anchor='middle'>" +
           W[i] + "</text>";
      // key vector, drawn small
      for (j = 0; j < 4; j++) {
        var v = K[i][j], h = Math.abs(v) * 22;
        s += "<rect x='" + (x + 4 + j * 12) + "' y='" + (250 - (v > 0 ? h : 0)).toFixed(1) +
             "' width='9' height='" + h.toFixed(1) + "' rx='1' fill='#3E6491' fill-opacity='0.6'/>";
      }
      // weight bar
      var bh = p[i] * 150;
      s += "<rect x='" + (x + 6) + "' y='" + (232 - bh).toFixed(1) + "' width='" + (CW - 20) +
           "' height='" + bh.toFixed(1) + "' rx='2' fill='#8C77BC' fill-opacity='0.85'/>";
      s += "<text class='wnum' x='" + (x + (CW - 8) / 2) + "' y='" + (226 - bh).toFixed(1) +
           "' text-anchor='middle'>" + (p[i] * 100).toFixed(0) + "%</text>";
    }
    s += "<line class='sep' x1='" + X0 + "' y1='250' x2='" + (X0 + N * CW - 8) + "' y2='250'/>";
    s += "<text class='gl' x='" + X0 + "' y='268'>each word's key vector, four numbers</text>";
    s += "<text class='gl' x='" + X0 + "' y='72'>attention weight from &#8220;" + W[qi] + "&#8221;</text>";
    scene.innerHTML = s;
    qOut.textContent = '“' + W[qi] + '”';
    tOut.textContent = '×' + sharp.toFixed(2) + ' on the scores';
    var best = p.indexOf(Math.max.apply(null, p));
    note.textContent = '“' + W[qi] + '” puts ' + (p[best] * 100).toFixed(0) +
      '% of its attention on “' + W[best] + '”. Every weight is positive and the ten of ' +
      'them add up to ' + p.reduce(function (a, b) { return a + b; }, 0).toFixed(3) +
      ', which is what makes this a blend rather than a pick. Turn the sharpness up and the ' +
      'softmax stops blending: that is exactly what section 4 is about.';
  }
  qR.addEventListener('input', draw);
  tR.addEventListener('input', draw);
  draw();
})();
</script>

### Heads, and the Width They Share Out

Two pieces of structure and we have a real model.

The first is that this is not done once across the full width of the vectors.
The width is *split* into several smaller pieces, and the whole procedure runs
on each piece independently with its own learned matrices. These pieces are
called **heads**, and the point of them is that a word can look for several
different things at once — one head might track grammatical subjects while
another tracks which noun a pronoun refers to. Because the width is divided
rather than duplicated, thirty-two heads cost about the same as one head using
the full width. This surprised me when I first worked it out, and it is worth
knowing if you were about to assume that more heads means proportionally more
computation.

The second is that the whole arrangement repeats. A model stacks this
structure into **layers**, dozens deep, each with its own learned matrices, and
the output of one layer is the input to the next. Llama 3 70B has 80 layers of
it.

<div class='knob'>
    <svg viewBox='0 0 720 200' id='hd-svg' role='img'
         aria-label='A bar representing the full width of a model vector, divided into a chosen number of heads. The total width and the total parameter count stay the same however many heads there are.'>
        <g id='hd-scene'></g>
    </svg>
    <div class='controls'>
        <label for='hd-n'>number of heads</label>
        <input type='range' id='hd-n' min='0' max='6' value='5' step='1'>
        <span class='readout' id='hd-n-out'></span>
    </div>
    <div class='controls'>
        <label for='hd-d'>model width $d$</label>
        <input type='range' id='hd-d' min='0' max='3' value='1' step='1'>
        <span class='readout' id='hd-d-out'></span>
    </div>
    <p class='note' id='hd-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 3.</span>
    The thing I got wrong when I first learned this. Adding heads does not add
    computation: the width is <b>divided</b> among them, so the pieces get
    narrower as they get more numerous. Watch the parameter count underneath
    stay perfectly still while you slide the number of heads from one to
    sixty-four.
</div>

<script>
(function () {
  var scene = document.getElementById('hd-scene'),
      nR = document.getElementById('hd-n'), dR = document.getElementById('hd-d'),
      nOut = document.getElementById('hd-n-out'), dOut = document.getElementById('hd-d-out'),
      note = document.getElementById('hd-note');
  var HEADS = [1, 2, 4, 8, 16, 32, 64], DS = [1024, 4096, 8192, 16384];
  var X0 = 30, X1 = 690, Y = 60, H = 40;
  var COLS = ['#8C77BC', '#3E6491', '#C48BAC', '#6E8C66', '#B07E55', '#22253E'];

  function draw() {
    var n = HEADS[+nR.value], d = DS[+dR.value], dh = d / n, s = '', i;
    var w = (X1 - X0) / n;
    for (i = 0; i < n; i++) {
      s += "<rect x='" + (X0 + i * w + 1).toFixed(1) + "' y='" + Y + "' width='" +
           (w - 2).toFixed(1) + "' height='" + H + "' rx='3' fill='" + COLS[i % COLS.length] +
           "' fill-opacity='0.8'/>";
      if (w > 34) {
        s += "<text class='wnum' x='" + (X0 + i * w + w / 2).toFixed(1) + "' y='" + (Y + 25) +
             "' text-anchor='middle' fill='#FFFFFF'>" + dh + "</text>";
      }
    }
    s += "<text class='gl' x='" + X0 + "' y='" + (Y - 10) + "'>one token's vector, " + d +
         " numbers wide, split into " + n + " head" + (n === 1 ? '' : 's') + "</text>";
    s += "<line class='sep' x1='" + X0 + "' y1='" + (Y + H + 14) + "' x2='" + X1 +
         "' y2='" + (Y + H + 14) + "'/>";
    // Parameters in the four projection matrices, which do not depend on n.
    var params = 4 * d * d;
    s += "<text class='axlabel' x='" + X0 + "' y='" + (Y + 44) +
         "'>each head is " + dh + " numbers wide</text>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (Y + 66) +
         "'>parameters in this layer's four projection matrices: " +
         (params / 1e6).toFixed(1) + "M</text>";
    var bw = (X1 - X0) * 0.55;
    s += "<rect x='" + X0 + "' y='" + (Y + 76) + "' width='" + bw.toFixed(1) +
         "' height='16' rx='3' fill='#8C77BC' fill-opacity='0.5'/>";
    s += "<text class='wnum' x='" + (X0 + bw + 8).toFixed(1) + "' y='" + (Y + 89) +
         "'>unchanged by the head count</text>";
    scene.innerHTML = s;
    nOut.textContent = n + ' head' + (n === 1 ? '' : 's');
    dOut.textContent = 'd = ' + d;
    note.textContent = n + ' heads of width ' + dh + ' comes to ' + (n * dh) +
      ' numbers in total, which is the width we started with. The projection matrices are ' +
      d + ' by ' + d + ' whatever we do, so this layer holds ' + (params / 1e6).toFixed(1) +
      'M parameters at one head and ' + (params / 1e6).toFixed(1) + 'M at ' + n +
      '. Splitting is free; the model simply gets to ask several narrower questions at once.';
  }
  nR.addEventListener('input', draw);
  dR.addEventListener('input', draw);
  draw();
})();
</script>

## 3. A Dictionary Nobody Wrote

Everything so far has been mechanism. The question that decides whether any of
it was a good idea is what those weights turn out to be, once a model has been
trained. Bahdanau and colleagues drew them, and I think this is still the most
persuasive picture in the subject.

<div class='figure'>
    <img src='/images/attention-alignment.png'
         alt='A grid with English words across the top and their French translation down the side.
              Dark cells mark high attention weight. A strong diagonal runs through it, and the
              rows for zone economique europeenne pick up Area, Economic and European in reverse
              order.'>
    <div class='caption'>
        <span class='caption-label'>Figure 4.</span>
        Reproduced from Bahdanau et al. (2014), Figure 3(a). Each cell is the
        attention weight the model put on an English word while producing a
        French one. I have recoloured it into this site's palette and inverted
        the scale, so darker now means more attention where the original used
        white; no weight has been altered.
    </div>
</div>

Take a moment over what this shows. Nobody told the model which English word
corresponds to which French one. There is no dictionary in the system, and no
component whose job is alignment. The model was trained to produce good
translations, and the weights are just the internal blend proportions it
happened to settle on.

What it settled on is the alignment. The strong diagonal is the easy part,
since translation mostly preserves order. The interesting part is where the
diagonal breaks. Follow the rows for "zone économique européenne" and you will
see them picking up "Area", "Economic" and "European" in reverse, because
French puts those adjectives after the noun and English puts them before. The
model learned to reorder, from nothing but examples of translated sentences.

This is also, I think, why attention became popular so quickly. It is unusual
to be able to look inside a neural network and find something so legible.

## 4. The Square Root, and What Breaks Without It

Now the detail I promised, which is the division by $\sqrt{d}$.

When I first saw that, I assumed it was a small numerical convenience, the kind
of constant that gets added to a denominator to avoid dividing by zero. It is
not. It is there to stop the model from becoming untrainable as it gets wider,
and the argument for it is short enough to do here in full.

Suppose the entries of $q$ and $k$ are independent, with mean zero and variance
one. Their dot product is $q \cdot k = \sum_{i=1}^{d} q_i k_i$, a sum of $d$
independent terms. Each term has mean zero, so the sum does too. And because
the variance of a sum of independent things is the sum of their variances, and
each term here has variance one,

$$
\operatorname{Var}(q \cdot k) \;=\; \sum_{i=1}^{d} \operatorname{Var}(q_i k_i) \;=\; d .
$$

So the typical size of a score grows like $\sqrt{d}$. A model 64 times wider
produces scores 8 times larger, for no reason connected to meaning, and the
fix follows immediately: divide by $\sqrt{d}$ and the variance goes back to
one.

The transformer paper gives this argument in a single footnote, and I find its
brevity slightly remarkable given how much rests on it. There is a nice piece
of evidence that the authors thought about saying more: their arXiv source
contains a whole section called "Justfication of the Scaling Factor in
Dot-product Attention" — typo theirs — which is commented out and never
appears in the paper you can read. What survived is one sentence in small
type.

Now, why does that matter? Because of what large scores do to the softmax.
Exponentiating a set of numbers exaggerates the gaps between them. If the
scores are close together, the weights come out fairly even and attention
behaves like a blend. If one score is far above the others, its exponential
dominates everything, the weight on it approaches one, and every other weight
approaches zero. Attention stops averaging and starts picking a single word.

That is bad for two reasons. The obvious one is that a blend is what we
wanted. The subtler and more serious one is that training a network requires
gradients, which measure how much the output would change if you nudged the
inputs. When a softmax has collapsed onto one option, nudging the scores
barely changes anything, so the gradient is nearly zero and the model stops
learning.

I should be careful about how firmly to state that, because the paper itself
is not firm about it. Its words are that they *suspect* the dot products grow
large and push the softmax "into regions where it has extremely small
gradients". That is a conjecture offered without evidence, and it has been
repeated ever since as though it were established. So let me supply the
evidence, since it turns out to be easy to obtain.

<div class='figure'>
    <img src='/images/attention-scaling.png'
         alt='Two panels. On the left, the measured variance of a dot product plotted against the
              width of the vectors on log axes, landing on the predicted line variance equals d.
              On the right, the attention weight falling on the single largest of 64 keys, which
              climbs to 95 percent without scaling but stays near 11 percent with it.'>
    <div class='caption'>
        <span class='caption-label'>Figure 5.</span>
        My own measurements, from <code>figures/attention.py</code>. In (a) I
        sampled random vectors at each width and measured the variance of
        their dot product; the points land on the predicted line. In (b) I
        pushed those scores through a softmax over 64 keys and measured how
        much weight fell on the largest one.
    </div>
</div>

Panel (a) is the closed form, checked. I sampled pairs of random vectors at
each width and measured the variance of their dot product, and the measurements
land on the line $\operatorname{Var} = d$ with a worst error of 1.26% across
three orders of magnitude. There is nothing subtle happening; it really is just
the variance of a sum.

Panel (b) is the consequence, and it is the part I would put on a slide. With
no scaling, the fraction of attention weight landing on the single largest key
climbs steadily with width: at $d = 1024$ it reaches **94.9%**, meaning the
softmax is effectively choosing one word out of sixty-four and ignoring the
rest. Divide by $\sqrt{d}$ and that same number sits at **10.7%**, essentially
unchanged from its value at $d = 2$. One division makes the mechanism behave
the same way at every width, which is what you want from a component you intend
to stack eighty of.

<div class='knob'>
    <svg viewBox='0 0 720 280' id='sc-svg' role='img'
         aria-label='Attention weights over sixteen keys, drawn twice: once from raw dot product scores and once after dividing by the square root of the width. As the width grows the unscaled weights collapse onto a single key while the scaled ones stay spread out.'>
        <g id='sc-scene'></g>
    </svg>
    <div class='controls'>
        <label for='sc-d'>width of the vectors, $d$</label>
        <input type='range' id='sc-d' min='0' max='9' value='6' step='1'>
        <span class='readout' id='sc-d-out'></span>
    </div>
    <div class='controls'>
        <label for='sc-s'>draw a fresh set of random vectors</label>
        <input type='range' id='sc-s' min='0' max='19' value='0' step='1'>
        <span class='readout' id='sc-s-out'></span>
    </div>
    <p class='note' id='sc-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 6.</span>
    The same sixteen keys, scored twice. On the left I send the raw dot
    products straight into the softmax; on the right I divide them by
    $\sqrt{d}$ first. Push the width up and watch the
    <span style='color:#B07E55'><b>unscaled</b></span> weights collapse onto
    one key while the <span style='color:#8C77BC'><b>scaled</b></span> ones
    keep their shape. Both columns are computed live from the same random
    vectors, so the only difference between them is the division.
</div>

<script>
(function () {
  var scene = document.getElementById('sc-scene'),
      dR = document.getElementById('sc-d'), sR = document.getElementById('sc-s'),
      dOut = document.getElementById('sc-d-out'), sOut = document.getElementById('sc-s-out'),
      note = document.getElementById('sc-note');
  var DIMS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], KEYS = 16;

  // A small deterministic generator, so the picture is reproducible and the
  // "fresh draw" slider is a seed rather than randomness the reader cannot
  // return to.
  function rand(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      var u = ((s >>> 8) / 16777216) || 1e-9;
      s = (s * 1664525 + 1013904223) >>> 0;
      var v = ((s >>> 8) / 16777216) || 1e-9;
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  }

  function softmax(z) {
    var m = Math.max.apply(null, z), p = z.map(function (x) { return Math.exp(x - m); });
    var t = p.reduce(function (a, b) { return a + b; }, 0);
    return p.map(function (x) { return x / t; });
  }

  function draw() {
    var d = DIMS[+dR.value], seed = +sR.value, g = rand(seed * 7919 + 13), i, j;
    var q = [], scores = [];
    for (j = 0; j < d; j++) { q.push(g()); }
    for (i = 0; i < KEYS; i++) {
      var dot = 0;
      for (j = 0; j < d; j++) { dot += q[j] * g(); }
      scores.push(dot);
    }
    var raw = softmax(scores), sca = softmax(scores.map(function (x) { return x / Math.sqrt(d); }));
    var s = '', PW = 300, GAP = 60, BW = PW / KEYS;
    [[raw, 30, '#B07E55', 'raw scores, straight into the softmax'],
     [sca, 30 + PW + GAP, '#8C77BC', 'scores divided by √d']].forEach(function (col) {
      var p = col[0], x0 = col[1];
      s += "<text class='gl' x='" + x0 + "' y='24'>" + col[3] + "</text>";
      for (i = 0; i < KEYS; i++) {
        var h = p[i] * 190;
        s += "<rect x='" + (x0 + i * BW + 1).toFixed(1) + "' y='" + (230 - h).toFixed(1) +
             "' width='" + (BW - 2).toFixed(1) + "' height='" + h.toFixed(1) +
             "' rx='1.5' fill='" + col[2] + "' fill-opacity='0.85'/>";
      }
      s += "<line class='sep' x1='" + x0 + "' y1='230' x2='" + (x0 + PW) + "' y2='230'/>";
      var top = Math.max.apply(null, p);
      s += "<text class='axlabel' x='" + x0 + "' y='250'>largest weight: " +
           (top * 100).toFixed(1) + "%</text>";
      s += "<text class='axlabel' x='" + x0 + "' y='266'>a flat blend would be " +
           (100 / KEYS).toFixed(1) + "% each</text>";
    });
    scene.innerHTML = s;
    dOut.textContent = 'd = ' + d;
    sOut.textContent = 'draw ' + (seed + 1) + ' of 20';
    var tr = Math.max.apply(null, raw) * 100, ts = Math.max.apply(null, sca) * 100;
    note.textContent = 'At d = ' + d + ', the unscaled softmax puts ' + tr.toFixed(1) +
      '% of the weight on one key and the scaled one puts ' + ts.toFixed(1) + '%. ' +
      (tr > 80 ? 'The left column has stopped being an average and become a choice, and a ' +
                 'softmax that has committed like that has almost no gradient left to learn from.'
               : 'Keep pushing the width up and watch the left column commit.');
  }
  dR.addEventListener('input', draw);
  sR.addEventListener('input', draw);
  draw();
})();
</script>

## 5. Chat This Over With Friends

The problem attention solves is one I can state without any mathematics at
all: the meaning of a word depends on which other words you look at, and the
useful ones are never at a fixed distance. So instead of averaging everything equally, or
looking back a fixed number of words, the model computes for each word how
much every other word matters to it, and blends them in those proportions. Each
word puts out three things — a description of what it is looking for, an advert
for what it offers, and the content it hands over — and the first two are
matched against each other to set the proportions. What convinced me this was more
than a trick is a picture from 2014: if you draw the weights a translation
model learned, you get the word alignment between the two languages, including
the places where French reverses the order of English adjectives. Nobody put a
dictionary in that model. It worked the alignment out from examples of
translated sentences, and you can see it having done so.

The thing most often skipped is the square root in the formula, which looks
like housekeeping and is not. Dot products of $d$ random numbers have variance
$d$, so the scores grow with the width of the model, and a softmax fed large
scores stops blending and starts picking one word. I measured it: without the
scaling, 94.9% of the attention weight lands on a single key by the time the
vectors are 1,024 wide, and there is almost no gradient left to train on. With
it, that figure is 10.7% and barely moves with width. The fair objection to how
I have told this is that my measurement uses random vectors, and a trained
model's queries and keys are not random — they are correlated in ways that
change the constants. What is genuinely unsettled is more interesting still:
attention costs time and memory that grow with the square of the sequence
length — and the [memory in particular](/blog/2026/08/13/kv-cache-costs/) is
now the hardest thing about running these models — so the current wave of
designs is quietly replacing some of it with cheaper mechanisms. The thing
everyone learns as the foundation is already being partly designed out.

## 6. References

1. Bahdanau, D., Cho, K., & Bengio, Y. (2014). Neural Machine Translation by
   Jointly Learning to Align and Translate. *ICLR* 2015.
   [arXiv:1409.0473](https://arxiv.org/abs/1409.0473)
2. Luong, M.-T., Pham, H., & Manning, C. D. (2015). Effective Approaches to
   Attention-based Neural Machine Translation. *EMNLP*.
   [arXiv:1508.04025](https://arxiv.org/abs/1508.04025)
3. Vaswani, A., et al. (2017). Attention Is All You Need. *NeurIPS*.
   [arXiv:1706.03762](https://arxiv.org/abs/1706.03762)
4. Grattafiori, A., et al. (2024). The Llama 3 Herd of Models.
   [arXiv:2407.21783](https://arxiv.org/abs/2407.21783)
