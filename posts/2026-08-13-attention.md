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
    <svg viewBox='0 0 720 380' role='img' aria-label='Two ways to translate. Above, three source words funnel into a single vector and the output is written from that alone. Below, every output word is joined directly to every source word.'>
      <text class='sk-lbl' x='12.0' y='24.0' text-anchor='start'>before 2014</text>
      <path class='sk-s2' d='M21.5,36.7 Q69.0,35.8 116.4,36.7 Q124.4,36.7 124.4,44.7 Q125.1,51.8 124.4,58.8 Q124.4,66.8 116.4,66.8 Q69.0,66.5 21.5,66.8 Q13.5,66.8 13.5,58.8 Q12.6,51.8 13.5,44.7 Q13.5,36.7 21.5,36.7'/>
      <path class='sk-s2' d='M21.2,36.9 Q69.1,36.8 117.1,36.9 Q125.1,36.9 125.1,44.9 Q125.1,51.5 125.1,58.1 Q125.1,66.1 117.1,66.1 Q69.1,66.3 21.2,66.1 Q13.2,66.1 13.2,58.1 Q13.8,51.5 13.2,44.9 Q13.2,36.9 21.2,36.9'/>
      <text class='sk-t' x='69.1' y='56.0' text-anchor='middle'>L'accord</text>
      <path class='sk-s2' d='M22.5,71.9 Q69.3,71.6 116.2,71.9 Q124.2,71.9 124.2,79.9 Q124.1,87.2 124.2,94.6 Q124.2,102.6 116.2,102.6 Q69.3,101.8 22.5,102.6 Q14.5,102.6 14.5,94.6 Q15.0,87.2 14.5,79.9 Q14.5,71.9 22.5,71.9'/>
      <path class='sk-s2' d='M22.6,71.7 Q69.1,71.0 115.6,71.7 Q123.6,71.7 123.6,79.7 Q123.5,87.3 123.6,94.9 Q123.6,102.9 115.6,102.9 Q69.1,102.8 22.6,102.9 Q14.6,102.9 14.6,94.9 Q13.8,87.3 14.6,79.7 Q14.6,71.7 22.6,71.7'/>
      <text class='sk-t' x='69.1' y='92.0' text-anchor='middle'>sur</text>
      <path class='sk-s2' d='M21.3,108.2 Q69.0,108.4 116.7,108.2 Q124.7,108.2 124.7,116.2 Q125.5,122.7 124.7,129.3 Q124.7,137.3 116.7,137.3 Q69.0,136.8 21.3,137.3 Q13.3,137.3 13.3,129.3 Q13.5,122.7 13.3,116.2 Q13.3,108.2 21.3,108.2'/>
      <path class='sk-s2' d='M21.7,107.7 Q69.0,107.3 116.2,107.7 Q124.2,107.7 124.2,115.7 Q123.5,123.0 124.2,130.4 Q124.2,138.4 116.2,138.4 Q69.0,139.1 21.7,138.4 Q13.7,138.4 13.7,130.4 Q14.0,123.0 13.7,115.7 Q13.7,107.7 21.7,107.7'/>
      <text class='sk-t' x='69.1' y='128.0' text-anchor='middle'>la</text>
      <path class='sk-thin' d='M124.0,51.7 Q205.1,68.0 286.0,85.5'/>
      <path class='sk-thin' d='M124.8,51.1 Q205.4,68.2 286.0,85.5'/>
      <path class='sk-thin' d='M123.7,86.3 Q205.0,85.5 286.3,86.4'/>
      <path class='sk-thin' d='M124.3,87.3 Q205.4,86.4 286.5,85.8'/>
      <path class='sk-thin' d='M124.4,123.5 Q205.4,105.4 286.0,86.0'/>
      <path class='sk-thin' d='M124.8,122.8 Q205.6,103.7 286.5,85.6'/>
      <path class='sk-mark' d='M294.8,70.4 Q350.5,70.0 406.2,70.4 Q414.2,70.4 414.2,78.4 Q414.9,85.8 414.2,93.2 Q414.2,101.2 406.2,101.2 Q350.5,101.7 294.8,101.2 Q286.8,101.2 286.8,93.2 Q286.2,85.8 286.8,78.4 Q286.8,70.4 294.8,70.4'/>
      <path class='sk-mark' d='M294.0,70.5 Q350.3,70.2 406.6,70.5 Q414.6,70.5 414.6,78.5 Q414.0,86.1 414.6,93.7 Q414.6,101.7 406.6,101.7 Q350.3,102.4 294.0,101.7 Q286.0,101.7 286.0,93.7 Q285.4,86.1 286.0,78.5 Q286.0,70.5 294.0,70.5'/>
      <text class='sk-t' x='350.4' y='91.0' text-anchor='middle'>one vector</text>
      <path class='sk-thin' d='M415.0,86.3 Q455.5,74.0 495.9,61.7'/>
      <path class='sk-thin' d='M414.5,85.4 Q455.3,74.3 495.8,62.0'/>
      <path class='sk-thin' d='M496.5,62.4 Q493.6,64.8 490.9,67.4'/>
      <path class='sk-thin' d='M495.4,62.3 Q492.7,61.0 489.7,60.3'/>
      <path class='sk-thin' d='M414.1,86.3 Q454.7,99.5 495.9,110.7'/>
      <path class='sk-thin' d='M414.3,85.7 Q455.1,99.2 496.5,110.4'/>
      <path class='sk-thin' d='M496.6,109.3 Q493.1,109.9 489.8,111.4'/>
      <path class='sk-thin' d='M495.6,110.6 Q493.7,107.8 491.7,105.0'/>
      <path class='sk-s3' d='M503.8,45.4 Q555.2,44.7 606.6,45.4 Q614.6,45.4 614.6,53.4 Q615.2,61.3 614.6,69.1 Q614.6,77.1 606.6,77.1 Q555.2,76.3 503.8,77.1 Q495.8,77.1 495.8,69.1 Q495.5,61.3 495.8,53.4 Q495.8,45.4 503.8,45.4'/>
      <path class='sk-s3' d='M504.0,46.9 Q555.4,46.9 606.9,46.9 Q614.9,46.9 614.9,54.9 Q614.7,62.5 614.9,70.1 Q614.9,78.1 606.9,78.1 Q555.4,78.2 504.0,78.1 Q496.0,78.1 496.0,70.1 Q495.1,62.5 496.0,54.9 Q496.0,46.9 504.0,46.9'/>
      <text class='sk-t' x='555.7' y='67.0' text-anchor='middle'>The</text>
      <path class='sk-s3' d='M504.3,93.5 Q555.8,94.0 607.4,93.5 Q615.4,93.5 615.4,101.5 Q615.9,109.5 615.4,117.4 Q615.4,125.4 607.4,125.4 Q555.8,125.3 504.3,125.4 Q496.3,125.4 496.3,117.4 Q495.6,109.5 496.3,101.5 Q496.3,93.5 504.3,93.5'/>
      <path class='sk-s3' d='M504.7,93.3 Q556.2,93.9 607.6,93.3 Q615.6,93.3 615.6,101.3 Q615.4,109.3 615.6,117.4 Q615.6,125.4 607.6,125.4 Q556.2,125.7 504.7,125.4 Q496.7,125.4 496.7,117.4 Q496.7,109.3 496.7,101.3 Q496.7,93.3 504.7,93.3'/>
      <text class='sk-t' x='555.7' y='115.0' text-anchor='middle'>agreement</text>
      <text class='sk-note' x='300.0' y='168.0' text-anchor='middle'>the whole sentence, squeezed through one gap</text>
      <path class='sk-faint' d='M11.7,191.8 Q360.0,191.3 708.3,191.7'/>
      <text class='sk-lbl' x='12.0' y='222.0' text-anchor='start'>after 2014</text>
      <path class='sk-s2' d='M22.5,234.1 Q69.4,234.2 116.4,234.1 Q124.4,234.1 124.4,242.1 Q124.0,249.3 124.4,256.5 Q124.4,264.5 116.4,264.5 Q69.4,263.9 22.5,264.5 Q14.5,264.5 14.5,256.5 Q15.4,249.3 14.5,242.1 Q14.5,234.1 22.5,234.1'/>
      <path class='sk-s2' d='M22.5,233.2 Q69.2,232.3 115.9,233.2 Q123.9,233.2 123.9,241.2 Q123.9,248.6 123.9,256.0 Q123.9,264.0 115.9,264.0 Q69.2,264.9 22.5,264.0 Q14.5,264.0 14.5,256.0 Q14.4,248.6 14.5,241.2 Q14.5,233.2 22.5,233.2'/>
      <text class='sk-t' x='69.1' y='254.0' text-anchor='middle'>L'accord</text>
      <path class='sk-s2' d='M22.8,269.1 Q69.9,269.0 117.1,269.1 Q125.1,269.1 125.1,277.1 Q126.0,284.3 125.1,291.5 Q125.1,299.5 117.1,299.5 Q69.9,299.0 22.8,299.5 Q14.8,299.5 14.8,291.5 Q14.0,284.3 14.8,277.1 Q14.8,269.1 22.8,269.1'/>
      <path class='sk-s2' d='M22.8,269.3 Q69.3,269.4 115.9,269.3 Q123.9,269.3 123.9,277.3 Q123.3,284.3 123.9,291.2 Q123.9,299.2 115.9,299.2 Q69.3,299.5 22.8,299.2 Q14.8,299.2 14.8,291.2 Q15.7,284.3 14.8,277.3 Q14.8,269.3 22.8,269.3'/>
      <text class='sk-t' x='69.1' y='290.0' text-anchor='middle'>sur</text>
      <path class='sk-s2' d='M21.9,305.2 Q69.4,304.2 116.9,305.2 Q124.9,305.2 124.9,313.2 Q124.9,320.6 124.9,327.9 Q124.9,335.9 116.9,335.9 Q69.4,336.4 21.9,335.9 Q13.9,335.9 13.9,327.9 Q13.5,320.6 13.9,313.2 Q13.9,305.2 21.9,305.2'/>
      <path class='sk-s2' d='M21.8,306.1 Q69.3,306.4 116.9,306.1 Q124.9,306.1 124.9,314.1 Q124.1,321.5 124.9,328.9 Q124.9,336.9 116.9,336.9 Q69.3,335.9 21.8,336.9 Q13.8,336.9 13.8,328.9 Q13.2,321.5 13.8,314.1 Q13.8,306.1 21.8,306.1'/>
      <text class='sk-t' x='69.1' y='326.0' text-anchor='middle'>la</text>
      <path class='sk-att' d='M124.8,249.1 Q310.6,255.3 496.4,260.3'/>
      <path class='sk-att' d='M123.7,249.2 Q309.6,255.3 495.6,259.4'/>
      <path class='sk-att' d='M124.3,248.8 Q310.4,278.8 496.5,308.5'/>
      <path class='sk-att' d='M123.5,248.9 Q309.9,279.4 496.5,308.6'/>
      <path class='sk-att' d='M123.9,285.7 Q309.6,272.5 495.3,260.7'/>
      <path class='sk-att' d='M124.2,285.5 Q310.1,273.4 495.9,260.2'/>
      <path class='sk-att' d='M124.7,285.0 Q310.2,296.0 495.7,307.7'/>
      <path class='sk-att' d='M124.0,285.3 Q310.3,295.7 496.5,307.9'/>
      <path class='sk-att' d='M124.5,320.9 Q310.2,289.9 496.2,260.4'/>
      <path class='sk-att' d='M124.7,321.4 Q310.3,290.2 496.0,259.9'/>
      <path class='sk-att' d='M123.6,320.7 Q309.8,314.6 495.9,307.6'/>
      <path class='sk-att' d='M123.6,321.5 Q310.1,313.8 496.7,308.3'/>
      <path class='sk-s3' d='M504.2,244.7 Q555.5,244.4 606.9,244.7 Q614.9,244.7 614.9,252.7 Q614.6,260.6 614.9,268.5 Q614.9,276.5 606.9,276.5 Q555.5,275.8 504.2,276.5 Q496.2,276.5 496.2,268.5 Q496.8,260.6 496.2,252.7 Q496.2,244.7 504.2,244.7'/>
      <path class='sk-s3' d='M503.8,243.1 Q555.5,243.1 607.3,243.1 Q615.3,243.1 615.3,251.1 Q616.0,259.5 615.3,267.8 Q615.3,275.8 607.3,275.8 Q555.5,275.5 503.8,275.8 Q495.8,275.8 495.8,267.8 Q496.2,259.5 495.8,251.1 Q495.8,243.1 503.8,243.1'/>
      <text class='sk-t' x='555.7' y='265.0' text-anchor='middle'>The</text>
      <path class='sk-s3' d='M503.2,292.1 Q555.3,291.5 607.4,292.1 Q615.4,292.1 615.4,300.1 Q614.9,308.1 615.4,316.2 Q615.4,324.2 607.4,324.2 Q555.3,324.1 503.2,324.2 Q495.2,324.2 495.2,316.2 Q496.1,308.1 495.2,300.1 Q495.2,292.1 503.2,292.1'/>
      <path class='sk-s3' d='M504.7,291.6 Q556.0,291.1 607.4,291.6 Q615.4,291.6 615.4,299.6 Q615.7,307.5 615.4,315.4 Q615.4,323.4 607.4,323.4 Q556.0,324.1 504.7,323.4 Q496.7,323.4 496.7,315.4 Q497.4,307.5 496.7,299.6 Q496.7,291.6 504.7,291.6'/>
      <text class='sk-t' x='555.7' y='313.0' text-anchor='middle'>agreement</text>
      <text class='sk-note' x='300.0' y='366.0' text-anchor='middle'>each output word picks its own blend, every time</text>
    </svg>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        The change that started all of this. Above, a translator squeezes
        the whole source sentence through one fixed vector and writes its
        output from that alone, which is why long sentences went so badly.
        Below, each output word reaches back to every source word and takes
        its own weighted blend of them. I have drawn only three source words
        here; imagine forty, and you can feel the upper design straining.
    </div>
</div>

## 1. Four Steps From a Translation Bug to Every Model You Have Heard Of

The idea arrived in 2014, and not as a grand theory. It was a fix for a
specific, visible failure.

<div class='roadmap'>
    <svg viewBox='0 0 760 380' role='img' aria-label='Roadmap of attention: a fix for a bottleneck in 2014, a simpler score in 2015, the recurrence dropped in 2017, and the transformer everywhere after.'>
      <path class='spine' d='M99.4,189.8 Q380.2,189.2 660.9,189.4'/>
      <path class='head' d='M179.8,189.7 Q192.8,189.5 205.8,189.7'/>
      <path class='head' d='M179.7,190.4 Q193.1,189.5 206.5,189.7'/>
      <path class='head' d='M206.4,189.6 Q204.0,191.5 201.1,192.7'/>
      <path class='head' d='M205.3,189.6 Q203.1,188.2 200.7,187.4'/>
      <text class='why' x='193.0' y='162.0'>the scoring network</text>
      <text class='why' x='193.0' y='179.0'>was extra machinery</text>
      <path class='head' d='M366.5,190.4 Q379.4,190.7 392.4,190.0'/>
      <path class='head' d='M367.3,190.2 Q379.9,189.6 392.5,189.4'/>
      <path class='head' d='M393.7,189.9 Q391.1,191.8 388.4,193.7'/>
      <path class='head' d='M393.1,189.5 Q390.4,187.9 387.8,186.3'/>
      <text class='why' x='380.0' y='162.0'>attention was fine;</text>
      <text class='why' x='380.0' y='179.0'>the recurrence was not</text>
      <path class='head' d='M554.2,189.6 Q567.4,190.5 580.7,190.3'/>
      <path class='head' d='M553.7,190.4 Q567.0,190.6 580.3,190.6'/>
      <path class='head' d='M580.1,189.6 Q577.1,191.4 574.3,193.3'/>
      <path class='head' d='M579.7,189.6 Q577.7,187.9 575.4,186.5'/>
      <text class='why' x='567.0' y='162.0'>quadratic cost, and a</text>
      <text class='why' x='567.0' y='179.0'>cache to feed</text>
      <g class='stop'>
        <rect class='hit' x='15.0' y='0.0' width='356.0' height='136.0'/>
        <path class='stem' d='M99.7,135.9 Q99.6,162.7 99.3,189.6'/>
        <circle class='dot' cx='99.5' cy='190.0' r='5'/>
        <path class='box' d='M23.5,-0.5 Q193.0,0.1 362.6,-0.5 Q371.6,-0.5 371.6,8.5 Q371.4,67.8 371.6,127.1 Q371.6,136.1 362.6,136.1 Q193.0,136.6 23.5,136.1 Q14.5,136.1 14.5,127.1 Q14.2,67.8 14.5,8.5 Q14.5,-0.5 23.5,-0.5'/>
        <path class='box' d='M23.6,0.8 Q192.8,1.6 362.1,0.8 Q371.1,0.8 371.1,9.8 Q371.3,68.1 371.1,126.3 Q371.1,135.3 362.1,135.3 Q192.8,134.6 23.6,135.3 Q14.6,135.3 14.6,126.3 Q13.9,68.1 14.6,9.8 Q14.6,0.8 23.6,0.8'/>
        <text class='yr' x='29.0' y='19.0'>2014</text>
        <text class='stage' x='29.0' y='37.0'>a fix for a bottleneck</text>
        <circle class='bul' cx='33.0' cy='52.0' r='2'/>
        <text class='body' x='42.0' y='56.0'>one fixed vector could not hold a long</text>
        <text class='body' x='42.0' y='74.0'>sentence</text>
        <circle class='bul' cx='33.0' cy='88.0' r='2'/>
        <text class='body' x='42.0' y='92.0'>let the decoder look back at every source</text>
        <text class='body' x='42.0' y='110.0'>word</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='15.0' y='244.0' width='356.0' height='136.0'/>
        <path class='stem' d='M287.2,243.6 Q287.0,217.0 285.9,190.3'/>
        <circle class='dot' cx='286.5' cy='190.0' r='5'/>
        <path class='box' d='M23.5,244.4 Q192.9,244.4 362.4,244.4 Q371.4,244.4 371.4,253.4 Q370.6,312.4 371.4,371.4 Q371.4,380.4 362.4,380.4 Q192.9,381.4 23.5,380.4 Q14.5,380.4 14.5,371.4 Q13.7,312.4 14.5,253.4 Q14.5,244.4 23.5,244.4'/>
        <path class='box' d='M24.1,243.8 Q192.8,244.5 361.6,243.8 Q370.6,243.8 370.6,252.8 Q370.1,311.7 370.6,370.7 Q370.6,379.7 361.6,379.7 Q192.8,379.1 24.1,379.7 Q15.1,379.7 15.1,370.7 Q14.4,311.7 15.1,252.8 Q15.1,243.8 24.1,243.8'/>
        <text class='yr' x='29.0' y='263.0'>2015</text>
        <text class='stage' x='29.0' y='281.0'>the score gets simpler</text>
        <circle class='bul' cx='33.0' cy='296.0' r='2'/>
        <text class='body' x='42.0' y='300.0'>replace the alignment network with a dot</text>
        <text class='body' x='42.0' y='318.0'>product</text>
        <circle class='bul' cx='33.0' cy='332.0' r='2'/>
        <text class='body' x='42.0' y='336.0'>cheaper, and the form still used today</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='0.0' width='356.0' height='136.0'/>
        <path class='stem' d='M473.2,135.8 Q474.1,162.6 473.9,189.5'/>
        <circle class='dot' cx='473.5' cy='190.0' r='5'/>
        <path class='box' d='M397.4,-0.7 Q566.9,-0.3 736.4,-0.7 Q745.4,-0.7 745.4,8.3 Q744.4,68.0 745.4,127.7 Q745.4,136.7 736.4,136.7 Q566.9,136.4 397.4,136.7 Q388.4,136.7 388.4,127.7 Q389.0,68.0 388.4,8.3 Q388.4,-0.7 397.4,-0.7'/>
        <path class='box' d='M397.6,0.8 Q566.7,-0.1 735.8,0.8 Q744.8,0.8 744.8,9.8 Q745.1,68.4 744.8,127.1 Q744.8,136.1 735.8,136.1 Q566.7,135.6 397.6,136.1 Q388.6,136.1 388.6,127.1 Q389.1,68.4 388.6,9.8 Q388.6,0.8 397.6,0.8'/>
        <text class='yr' x='403.0' y='19.0'>2017</text>
        <text class='stage' x='403.0' y='37.0'>drop the recurrence</text>
        <circle class='bul' cx='407.0' cy='52.0' r='2'/>
        <text class='body' x='416.0' y='56.0'>keep only attention, pointed at the</text>
        <text class='body' x='416.0' y='74.0'>sequence itself</text>
        <circle class='bul' cx='407.0' cy='88.0' r='2'/>
        <text class='body' x='416.0' y='92.0'>multiple heads, and the square-root scaling</text>
        <circle class='bul' cx='407.0' cy='106.0' r='2'/>
        <text class='body' x='416.0' y='110.0'>all positions at once, so training</text>
        <text class='body' x='416.0' y='128.0'>parallelizes</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='244.0' width='356.0' height='136.0'/>
        <path class='stem' d='M661.0,244.2 Q660.6,216.9 660.5,189.6'/>
        <circle class='dot' cx='660.5' cy='190.0' r='5'/>
        <path class='box' d='M398.3,243.9 Q567.2,244.5 736.0,243.9 Q745.0,243.9 745.0,252.9 Q745.7,312.2 745.0,371.6 Q745.0,380.6 736.0,380.6 Q567.2,379.9 398.3,380.6 Q389.3,380.6 389.3,371.6 Q389.8,312.2 389.3,252.9 Q389.3,243.9 398.3,243.9'/>
        <path class='box' d='M398.2,243.8 Q567.3,243.9 736.4,243.8 Q745.4,243.8 745.4,252.8 Q745.4,311.8 745.4,370.7 Q745.4,379.7 736.4,379.7 Q567.3,379.6 398.2,379.7 Q389.2,379.7 389.2,370.7 Q388.5,311.8 389.2,252.8 Q389.2,243.8 398.2,243.8'/>
        <text class='yr' x='403.0' y='263.0'>2018-</text>
        <text class='stage' x='403.0' y='281.0'>everything is a transformer</text>
        <circle class='bul' cx='407.0' cy='296.0' r='2'/>
        <text class='body' x='416.0' y='300.0'>BERT and GPT build on it</text>
        <circle class='bul' cx='407.0' cy='314.0' r='2'/>
        <text class='body' x='416.0' y='318.0'>by the 2020s hybrids swap some attention</text>
        <text class='body' x='416.0' y='336.0'>back out</text>
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
    <svg viewBox='0 0 720 246' id='qkv-svg' role='img'
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
    arithmetic, not a mock-up. The percentages are the true weights; the bar
    heights are scaled so the largest always fills the row, which is what
    makes the shape of the distribution visible. Slide the second control and
    watch the softmax change its mind about how decisive to be.
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
  var N = W.length, X0 = 26, CW = 67, TOP = 40, BASE = 88, MAXH = 96;

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
    var pmax = Math.max.apply(null, p);

    s += "<text class='gl' x='" + X0 + "' y='22'>the sentence, one word per column</text>";
    for (i = 0; i < N; i++) {
      var x = X0 + i * CW, isq = i === qi;
      s += "<rect class='cell " + (isq ? 'fresh' : 'kept') + "' x='" + x + "' y='" + TOP +
           "' width='" + (CW - 7) + "' height='26' rx='3'/>";
      s += "<text class='tk' text-anchor='middle' x='" + (x + (CW - 7) / 2) + "' y='" +
           (TOP + 18) + "'>" + W[i] + "</text>";
      // Scaled to the largest weight in this distribution, so the tallest bar
      // always fills the space. On an absolute scale a set of ten weights
      // near 10% each left two thirds of the figure empty.
      var bh = (p[i] / pmax) * MAXH;
      s += "<rect x='" + (x + 7) + "' y='" + BASE + "' width='" + (CW - 21) +
           "' height='" + bh.toFixed(1) + "' rx='2' fill='#8C77BC' fill-opacity='0.85'/>";
      s += "<text class='wnum' text-anchor='middle' x='" + (x + (CW - 7) / 2) + "' y='" +
           (BASE + bh + 13).toFixed(1) + "'>" + (p[i] * 100).toFixed(0) + "%</text>";
      // key vector, four small bars about a midline
      for (j = 0; j < 4; j++) {
        var v = K[i][j], h = Math.abs(v) * 20;
        s += "<rect x='" + (x + 8 + j * 12) + "' y='" + (218 - (v > 0 ? h : 0)).toFixed(1) +
             "' width='9' height='" + h.toFixed(1) + "' rx='1' fill='#3E6491' fill-opacity='0.6'/>";
      }
    }
    s += "<line class='sep' x1='" + X0 + "' y1='" + BASE + "' x2='" + (X0 + N * CW - 7) +
         "' y2='" + BASE + "'/>";
    s += "<line class='sep' x1='" + X0 + "' y1='218' x2='" + (X0 + N * CW - 7) + "' y2='218'/>";
    s += "<text class='gl' x='" + X0 + "' y='236'>each word's key vector \u2014 these belong to " +
         "the words, so they do not change when you pick a different asker</text>";
    s += "<text class='gl' x='" + X0 + "' y='" + (BASE - 8) + "'>attention weight from &#8220;" +
         W[qi] + "&#8221;, hanging down</text>";
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
    <svg viewBox='0 0 720 186' id='hd-svg' role='img'
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
  var X0 = 30, X1 = 690, Y = 56, H = 40;
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
    s += "<text class='gl' x='" + X0 + "' y='" + (Y - 12) + "'>one token's vector, " + d +
         " numbers wide, split into " + n + " head" + (n === 1 ? '' : 's') + "</text>";
    s += "<line class='sep' x1='" + X0 + "' y1='" + (Y + H + 12) + "' x2='" + X1 +
         "' y2='" + (Y + H + 12) + "'/>";
    // Parameters in the four projection matrices, which do not depend on n.
    var params = 4 * d * d;
    s += "<text class='axlabel' x='" + X0 + "' y='" + (Y + H + 30) +
         "'>each head is " + dh + " numbers wide</text>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (Y + H + 54) +
         "'>parameters in this layer's four projection matrices: " +
         (params / 1e6).toFixed(1) + "M</text>";
    var bw = (X1 - X0) * 0.55;
    s += "<rect x='" + X0 + "' y='" + (Y + H + 62) + "' width='" + bw.toFixed(1) +
         "' height='18' rx='3' fill='#8C77BC' fill-opacity='0.5'/>";
    s += "<text class='wnum' x='" + (X0 + bw + 10).toFixed(1) + "' y='" + (Y + H + 76) +
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

<div class='figure medium'>
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
