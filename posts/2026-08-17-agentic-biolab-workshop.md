---
title: A Day at the Agentic Biolab Workshop
subtitle: The bottleneck in AI for science is not the model but the world you can check it against.
date: 2026-08-17
tags: uncat
icon: 🍵
---

I spent today at the Agentic Biolab Workshop, run by Princeton's
Omenn-Darling Bioengineering Institute together with AI², the university's
*AI for Accelerating Invention* initiative.

I went in expecting a day of biology I would half understand. I came out with
something else, which is why I am writing this instead of filing my notes.
The talks were about genomes, birds, graphene, neurons and protein cages, and
underneath they were all about the same problem — a problem I recognise from
language modelling.

Here is the claim I left with. **The hard part is no longer the model. The
hard part is building a world the model can be checked against.** Every talk
was, in its own vocabulary, an answer to that.

Cliff Brangwynne, who directs the institute, opened the day by putting it as a
change in what thinking is. He described not a faster tool but a different
arrangement, and he used the word *co-intelligence* for it. The argument was
that we should envision that arrangement and prepare for it rather than wait
to be surprised by it. I want to take it seriously enough to ask what would
have to be true for it to work.

Two things before I start. The talks were not recorded, so every summary of
one below is my reconstruction and not the speaker's words, and where I
disagree with somebody I am disagreeing with my own notes of what they said.
And this post assumes you know nothing about genome editing, protein design or
two-dimensional materials. I did not know much either. What it does assume is
an interest in how these systems get built, and in how anybody could tell
whether they work.

[TOC]

## Three Years From a Prompt to a Pair of Robot Arms

Some ground first. The phrase *AI co-scientist* is about three years old and
it has already meant four different things. Knowing which one a speaker means
saves a great deal of confusion.

<div class='roadmap'>
    <svg viewBox='0 0 760 384' role='img' aria-label='Roadmap of the AI co-scientist: tool-using chemists in 2023, domain agents in 2024, benchmarks and generalists in 2025, and a robotic body in 2026.'>
      <path class='spine' d='M99.4,191.7 Q379.7,191.7 659.9,191.4'/>
      <path class='head' d='M180.2,192.5 Q193.0,192.1 205.9,192.4'/>
      <path class='head' d='M180.4,191.4 Q193.5,192.0 206.5,191.8'/>
      <path class='head' d='M205.8,191.4 Q203.6,193.7 201.1,195.7'/>
      <path class='head' d='M205.7,192.2 Q203.5,190.6 201.1,189.3'/>
      <text class='why' x='193.0' y='163.0'>a demo is not a</text>
      <text class='why' x='193.0' y='181.0'>protocol</text>
      <path class='head' d='M367.3,191.6 Q380.0,191.7 392.7,192.3'/>
      <path class='head' d='M366.5,192.0 Q379.5,192.5 392.5,192.0'/>
      <path class='head' d='M392.4,192.1 Q389.9,193.5 387.3,194.4'/>
      <path class='head' d='M393.5,191.7 Q391.1,190.0 388.5,188.9'/>
      <text class='why' x='380.0' y='163.0'>nobody could score</text>
      <text class='why' x='380.0' y='181.0'>the reasoning</text>
      <path class='head' d='M554.2,192.5 Q566.9,192.3 579.6,191.9'/>
      <path class='head' d='M553.4,192.6 Q566.9,192.4 580.3,191.5'/>
      <path class='head' d='M579.5,191.6 Q576.9,192.9 574.9,194.9'/>
      <path class='head' d='M580.2,192.3 Q577.7,190.4 575.4,188.3'/>
      <text class='why' x='567.0' y='163.0'>the answer still has</text>
      <text class='why' x='567.0' y='181.0'>to be made</text>
      <g class='stop'>
        <rect class='hit' x='15.0' y='0.0' width='356.0' height='136.0'/>
        <path class='stem' d='M100.2,136.3 Q99.3,164.1 99.0,191.9'/>
        <circle class='dot' cx='99.5' cy='192.0' r='5'/>
        <path class='box' d='M24.1,0.3 Q193.0,0.4 361.9,0.3 Q370.9,0.3 370.9,9.3 Q371.6,68.5 370.9,127.7 Q370.9,136.7 361.9,136.7 Q193.0,136.3 24.1,136.7 Q15.1,136.7 15.1,127.7 Q15.1,68.5 15.1,9.3 Q15.1,0.3 24.1,0.3'/>
        <path class='box' d='M23.6,-0.7 Q193.0,-0.2 362.5,-0.7 Q371.5,-0.7 371.5,8.3 Q372.5,67.2 371.5,126.1 Q371.5,135.1 362.5,135.1 Q193.0,135.7 23.6,135.1 Q14.6,135.1 14.6,126.1 Q14.0,67.2 14.6,8.3 Q14.6,-0.7 23.6,-0.7'/>
        <text class='yr' x='29.0' y='21.0'>2023</text>
        <text class='stage' x='29.0' y='45.0'>the tool-using chemist</text>
        <circle class='bul' cx='33.0' cy='63.0' r='2'/>
        <text class='body' x='42.0' y='67.0'>Coscientist wires GPT-4 to search, code</text>
        <text class='body' x='42.0' y='86.5'>and a cloud lab</text>
        <circle class='bul' cx='33.0' cy='102.0' r='2'/>
        <text class='body' x='42.0' y='106.0'>it plans and runs real cross-coupling</text>
        <text class='body' x='42.0' y='125.5'>reactions</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='15.0' y='248.0' width='356.0' height='136.0'/>
        <path class='stem' d='M286.1,248.0 Q286.1,219.7 286.4,191.4'/>
        <circle class='dot' cx='286.5' cy='192.0' r='5'/>
        <path class='box' d='M23.4,248.3 Q193.1,248.4 362.8,248.3 Q371.8,248.3 371.8,257.3 Q372.7,315.9 371.8,374.4 Q371.8,383.4 362.8,383.4 Q193.1,383.2 23.4,383.4 Q14.4,383.4 14.4,374.4 Q14.0,315.9 14.4,257.3 Q14.4,248.3 23.4,248.3'/>
        <path class='box' d='M24.1,248.9 Q193.3,249.2 362.5,248.9 Q371.5,248.9 371.5,257.9 Q371.2,316.8 371.5,375.7 Q371.5,384.7 362.5,384.7 Q193.3,384.9 24.1,384.7 Q15.1,384.7 15.1,375.7 Q15.8,316.8 15.1,257.9 Q15.1,248.9 24.1,248.9'/>
        <text class='yr' x='29.0' y='269.0'>2024</text>
        <text class='stage' x='29.0' y='293.0'>the domain agent</text>
        <circle class='bul' cx='33.0' cy='311.0' r='2'/>
        <text class='body' x='42.0' y='315.0'>CRISPR-GPT decomposes a gene-editing</text>
        <text class='body' x='42.0' y='334.5'>experiment</text>
        <circle class='bul' cx='33.0' cy='350.0' r='2'/>
        <text class='body' x='42.0' y='354.0'>guide design, delivery, assay and</text>
        <text class='body' x='42.0' y='373.5'>analysis as one plan</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='0.0' width='356.0' height='136.0'/>
        <path class='stem' d='M472.8,135.5 Q473.7,163.8 474.1,192.1'/>
        <circle class='dot' cx='473.5' cy='192.0' r='5'/>
        <path class='box' d='M397.4,-0.3 Q567.0,-1.1 736.5,-0.3 Q745.5,-0.3 745.5,8.7 Q746.5,67.5 745.5,126.4 Q745.5,135.4 736.5,135.4 Q567.0,136.3 397.4,135.4 Q388.4,135.4 388.4,126.4 Q388.4,67.5 388.4,8.7 Q388.4,-0.3 397.4,-0.3'/>
        <path class='box' d='M397.7,0.3 Q566.9,0.1 736.2,0.3 Q745.2,0.3 745.2,9.3 Q744.4,68.2 745.2,127.1 Q745.2,136.1 736.2,136.1 Q566.9,135.8 397.7,136.1 Q388.7,136.1 388.7,127.1 Q388.2,68.2 388.7,9.3 Q388.7,0.3 397.7,0.3'/>
        <text class='yr' x='403.0' y='21.0'>2025</text>
        <text class='stage' x='403.0' y='45.0'>benchmarks and generalists</text>
        <circle class='bul' cx='407.0' cy='63.0' r='2'/>
        <text class='body' x='416.0' y='67.0'>Biomni: 150 tools, 105 packages, 59</text>
        <text class='body' x='416.0' y='86.5'>databases</text>
        <circle class='bul' cx='407.0' cy='102.0' r='2'/>
        <text class='body' x='416.0' y='106.0'>Genome-Bench scores answers against 11</text>
        <text class='body' x='416.0' y='125.5'>years of expert argument</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='248.0' width='356.0' height='136.0'/>
        <path class='stem' d='M660.6,247.8 Q660.9,219.5 660.1,191.3'/>
        <circle class='dot' cx='660.5' cy='192.0' r='5'/>
        <path class='box' d='M398.1,247.8 Q567.4,247.3 736.8,247.8 Q745.8,247.8 745.8,256.8 Q744.8,315.6 745.8,374.5 Q745.8,383.5 736.8,383.5 Q567.4,384.4 398.1,383.5 Q389.1,383.5 389.1,374.5 Q388.8,315.6 389.1,256.8 Q389.1,247.8 398.1,247.8'/>
        <path class='box' d='M398.1,248.2 Q566.9,248.8 735.7,248.2 Q744.7,248.2 744.7,257.2 Q745.2,315.7 744.7,374.3 Q744.7,383.3 735.7,383.3 Q566.9,383.5 398.1,383.3 Q389.1,383.3 389.1,374.3 Q389.9,315.7 389.1,257.2 Q389.1,248.2 398.1,248.2'/>
        <text class='yr' x='403.0' y='269.0'>2026</text>
        <text class='stage' x='403.0' y='293.0'>a body for the agent</text>
        <circle class='bul' cx='407.0' cy='311.0' r='2'/>
        <text class='body' x='416.0' y='315.0'>Qumus puts the whole loop inside a</text>
        <text class='body' x='416.0' y='334.5'>robotic minilab</text>
        <circle class='bul' cx='407.0' cy='350.0' r='2'/>
        <text class='body' x='416.0' y='354.0'>the first AI-created graphene, and a</text>
        <text class='body' x='416.0' y='373.5'>working transistor</text>
      </g>
    </svg>
</div>

The first step was the easy one to imagine. In 2023 a group at Carnegie Mellon
wired GPT-4 to a web search, a Python interpreter, and the programming
interface of a *cloud laboratory* — a facility where robots run your
experiment for you and you send the protocol over the internet.

They called the result Coscientist, and it planned and ran real reactions of
the kind that join two carbon fragments together using a palladium catalyst.
That paper landed in *Nature*, and it changed the conversation, because the
model was no longer only writing about chemistry.

A demonstration is not a protocol, though, and the next step is the one I
think matters more. It was Le Cong's work at Stanford, and it stopped asking a
general model to be a scientist. It built an agent that knows one experiment
deeply instead.

The experiment is gene editing with CRISPR, a system that cuts DNA at a chosen
place. What tells it where to cut is a short piece of RNA called the guide.
CRISPR-GPT decomposes such an experiment into its real stages — choosing the
editing system, designing the guide, choosing how to deliver it into the cell,
designing the assay that will tell you whether it worked, analysing the result
— and walks a researcher through all of them. It is now published in *Nature
Biomedical Engineering*.

Then came the question nobody could avoid. If you build one of these, how do
you know it is any good? That is what most of the interesting work in 2025 was
about, and it is where the day really started.

## 1. The Datasets Nobody Meant to Collect

Cong's talk came in two halves. The first was about foundation models for
engineering genomes and cells. On the genome side that means RNA language
models — the same next-token machinery as a chatbot, trained on RNA sequence
instead of English. On the cell side he made a case that cardiovascular
disease is where the most is at stake, which turns getting mitochondria into
heart cells into the delivery problem worth solving.

I want to dwell on the second half of the talk, because it asked how you would
ever evaluate any of this.

Three speakers gave talks that looked nothing like each other. Cong spoke on
genome engineering, Pietro Perona on identifying species from photographs, and
Steve Finkbeiner on neurodegeneration. By the afternoon I was convinced they
had all given the same talk.

The shared question is this: **where does the training signal come from, when
the thing you want the model to learn is not written down anywhere?**

<div class='sketch'>
    <svg viewBox='0 0 720 274' role='img' aria-label='Three sources of training signal on the left -- forum argument, amateur photographs, clinical outcomes -- feeding one training signal, then a model, with a return arrow along the bottom back to the sources.'>
      <text class='sk-lbl' x='14.0' y='16.0' text-anchor='start'>where the signal comes from</text>
      <path class='sk-s2' d='M21.5,28.1 Q124.8,27.9 228.2,28.1 Q236.2,28.1 236.2,36.1 Q236.9,54.3 236.2,72.5 Q236.2,80.5 228.2,80.5 Q124.8,80.8 21.5,80.5 Q13.5,80.5 13.5,72.5 Q13.3,54.3 13.5,36.1 Q13.5,28.1 21.5,28.1'/>
      <path class='sk-s2' d='M21.2,28.5 Q124.0,28.5 226.9,28.5 Q234.9,28.5 234.9,36.5 Q235.4,54.5 234.9,72.5 Q234.9,80.5 226.9,80.5 Q124.0,80.9 21.2,80.5 Q13.2,80.5 13.2,72.5 Q14.0,54.5 13.2,36.5 Q13.2,28.5 21.2,28.5'/>
      <text class='sk-t' x='124.8' y='48.0' text-anchor='middle'>forum argument</text>
      <text class='sk-sub' x='124.8' y='70.0' text-anchor='middle'>3,332 questions, 11 years</text>
      <path class='sk-thin' d='M239.0,53.8 Q263.9,86.9 289.2,119.7'/>
      <path class='sk-thin' d='M239.1,53.9 Q264.1,87.0 289.4,119.8'/>
      <path class='sk-thin' d='M289.9,120.6 Q287.0,119.9 284.5,118.4'/>
      <path class='sk-thin' d='M289.5,119.7 Q288.9,116.6 288.4,113.6'/>
      <path class='sk-s2' d='M21.4,94.2 Q124.6,94.1 227.8,94.2 Q235.8,94.2 235.8,102.2 Q236.3,119.7 235.8,137.1 Q235.8,145.1 227.8,145.1 Q124.6,144.7 21.4,145.1 Q13.4,145.1 13.4,137.1 Q13.4,119.7 13.4,102.2 Q13.4,94.2 21.4,94.2'/>
      <path class='sk-s2' d='M22.7,93.4 Q124.9,92.8 227.1,93.4 Q235.1,93.4 235.1,101.4 Q235.3,119.8 235.1,138.3 Q235.1,146.3 227.1,146.3 Q124.9,146.7 22.7,146.3 Q14.7,146.3 14.7,138.3 Q15.2,119.8 14.7,101.4 Q14.7,93.4 22.7,93.4'/>
      <text class='sk-t' x='124.8' y='114.0' text-anchor='middle'>amateur photographs</text>
      <text class='sk-sub' x='124.8' y='136.0' text-anchor='middle'>iNaturalist and Merlin</text>
      <path class='sk-thin' d='M238.9,120.4 Q264.1,120.0 289.4,120.5'/>
      <path class='sk-thin' d='M239.0,120.6 Q264.2,120.1 289.4,119.4'/>
      <path class='sk-thin' d='M289.0,120.6 Q286.7,121.7 284.3,122.7'/>
      <path class='sk-thin' d='M289.5,120.1 Q286.6,118.8 283.9,117.3'/>
      <path class='sk-s2' d='M21.8,159.6 Q124.4,159.3 227.1,159.6 Q235.1,159.6 235.1,167.6 Q235.8,185.9 235.1,204.2 Q235.1,212.2 227.1,212.2 Q124.4,213.1 21.8,212.2 Q13.8,212.2 13.8,204.2 Q13.6,185.9 13.8,167.6 Q13.8,159.6 21.8,159.6'/>
      <path class='sk-s2' d='M21.4,160.4 Q124.7,159.8 228.0,160.4 Q236.0,160.4 236.0,168.4 Q235.9,186.0 236.0,203.7 Q236.0,211.7 228.0,211.7 Q124.7,211.6 21.4,211.7 Q13.4,211.7 13.4,203.7 Q14.0,186.0 13.4,168.4 Q13.4,160.4 21.4,160.4'/>
      <text class='sk-t' x='124.8' y='180.0' text-anchor='middle'>clinical outcomes</text>
      <text class='sk-sub' x='124.8' y='202.0' text-anchor='middle'>read back into the model</text>
      <path class='sk-thin' d='M240.2,186.2 Q264.7,152.9 288.9,119.3'/>
      <path class='sk-thin' d='M238.8,185.9 Q265.3,153.9 290.1,120.6'/>
      <path class='sk-thin' d='M289.0,119.9 Q288.7,122.8 289.0,125.7'/>
      <path class='sk-thin' d='M289.9,119.9 Q286.7,121.2 283.7,122.8'/>
      <path class='sk-s' d='M303.8,94.1 Q406.5,94.2 509.1,94.1 Q517.1,94.1 517.1,102.1 Q517.4,119.6 517.1,137.1 Q517.1,145.1 509.1,145.1 Q406.5,144.8 303.8,145.1 Q295.8,145.1 295.8,137.1 Q296.4,119.6 295.8,102.1 Q295.8,94.1 303.8,94.1'/>
      <path class='sk-s' d='M302.8,94.6 Q405.8,94.5 508.8,94.6 Q516.8,94.6 516.8,102.6 Q517.2,119.9 516.8,137.2 Q516.8,145.2 508.8,145.2 Q405.8,145.3 302.8,145.2 Q294.8,145.2 294.8,137.2 Q295.6,119.9 294.8,102.6 Q294.8,94.6 302.8,94.6'/>
      <text class='sk-t' x='406.2' y='114.0' text-anchor='middle'>a training signal</text>
      <text class='sk-sub' x='406.2' y='136.0' text-anchor='middle'>what a model is scored on</text>
      <path class='sk-thin' d='M520.8,119.5 Q545.8,118.3 570.8,119.4'/>
      <path class='sk-thin' d='M520.4,120.6 Q546.0,121.7 571.6,120.6'/>
      <path class='sk-thin' d='M570.4,120.5 Q568.0,121.7 566.1,123.6'/>
      <path class='sk-thin' d='M570.3,120.2 Q567.9,118.6 565.6,116.7'/>
      <path class='sk-mark' d='M584.3,94.2 Q636.4,94.0 688.5,94.2 Q696.5,94.2 696.5,102.2 Q696.3,119.8 696.5,137.4 Q696.5,145.4 688.5,145.4 Q636.4,145.6 584.3,145.4 Q576.3,145.4 576.3,137.4 Q576.7,119.8 576.3,102.2 Q576.3,94.2 584.3,94.2'/>
      <path class='sk-mark' d='M585.2,93.6 Q637.1,93.2 689.0,93.6 Q697.0,93.6 697.0,101.6 Q697.8,120.1 697.0,138.7 Q697.0,146.7 689.0,146.7 Q637.1,145.9 585.2,146.7 Q577.2,146.7 577.2,138.7 Q576.4,120.1 577.2,101.6 Q577.2,93.6 585.2,93.6'/>
      <text class='sk-t' x='636.7' y='125.0' text-anchor='middle'>the model</text>
      <path class='sk-faint' d='M636.5,149.5 Q637.0,194.0 637.4,238.4'/>
      <path class='sk-faint' d='M637.2,150.1 Q637.9,193.8 637.2,237.5'/>
      <path class='sk-faint' d='M637.1,238.1 Q381.3,238.5 125.4,238.3'/>
      <path class='sk-faint' d='M636.6,238.3 Q380.9,237.6 125.2,238.5'/>
      <path class='sk-faint' d='M125.4,238.2 Q125.8,228.1 124.1,218.1'/>
      <path class='sk-faint' d='M124.6,238.5 Q125.6,228.2 125.0,217.9'/>
      <path class='sk-faint' d='M124.5,218.1 Q126.1,220.6 127.9,222.9'/>
      <path class='sk-faint' d='M124.4,218.4 Q123.1,221.0 121.6,223.5'/>
      <text class='sk-note' x='360.0' y='260.0' text-anchor='middle'>and what it answers becomes the next thing an expert argues about</text>
      <circle class='sig-dot sig-d1' cx='239.5' cy='54.0' r='5'/>
      <circle class='sig-dot sig-d2' cx='239.5' cy='120.0' r='5'/>
      <circle class='sig-dot sig-d3' cx='239.5' cy='186.0' r='5'/>
      <circle class='sig-dot sig-back' cx='636.7' cy='238' r='5'/>
    </svg>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        Three talks, one shape. Cong takes his signal from eleven years of
        scientists arguing on a forum, Perona from millions of amateur
        photographs corrected by a few experts, Finkbeiner from what happened
        to the patient. None of these existed as a dataset until somebody
        decided to treat them as one. Watch the arrow along the bottom: what
        the model answers goes back to the people who made the signal, and
        their reaction is the next round of it.
    </div>
</div>

Take Cong's answer first, because it is the one that made me sit up. His group
built a benchmark called Genome-Bench, and its source is a genome-engineering
forum where working scientists argued with each other for eleven years. Not
textbooks, and not papers, but threads where somebody says their edit did not
work and five people suggest why.

The pipeline parses those email threads, uses a language model to pull
question–answer–context triples out of them, and turns each triple into a
multiple-choice question. The result is 3,332 of them, spanning seven areas
from guide design to what the paper politely calls practical considerations
and lab logistics.

I find that choice of source quietly radical. A textbook records what a field
agreed on. A forum thread records what it was still fighting about, which is
exactly the part a model cannot get anywhere else.

Then they trained on it with reinforcement learning, which means the model is
not shown correct answers to copy but is scored on the answers it produces and
nudged toward whatever scored well. Here is the figure that carries the paper.

<div class='figure'>
    <img src='/images/agentic-genomebench-accuracy.png'>
    <div class='caption'>
        <span class='caption-label'>Figure 2.</span>
        Sixteen models on the same genomics questions, twenty-one bars between
        them, from Yin et al. (2025), Figure 2(a), recoloured into this site's
        palette. The <span style='color:#3E6491'><b>blue</b></span> bars are
        frontier commercial models, evaluated as they come. The
        <span style='color:#C48BAC'><b>rose</b></span> and
        <span style='color:#8C77BC'><b>lavender</b></span> pairs are five small
        open models before and after reinforcement learning on the forum data,
        and the <span style='color:#22253E'><b>dark</b></span> bar at the right
        is a router. The pair I keep looking at is Qwen2.5-7B: 58.85% before,
        76.85% after, with DeepSeek-R1 at 78.97%. Seven billion parameters,
        trained on arguments, standing on the same shelf as the frontier.
    </div>
</div>

Read the last few bars and you have the point of the whole exercise. That is
eighteen points of gain from the forum data alone. The dark bar is a *router*,
a small model whose only job is to look at a question and hand it to whichever
of four fine-tuned specialists is likeliest to get it right, and it comes out
on top at 81.07%.

Two cautions before that number is allowed to carry any weight. The test split
is 661 questions, so the standard error on any of these accuracies is about
1.6 points — which means the 2.1 points between the fine-tuned 7B and
DeepSeek-R1 and the 2.1 points between the router and DeepSeek-R1 are both
inside the noise. I should not call the first gap "as good as" and the second
"better than", and neither should the chart.

And the comparison is not like for like. The small models were trained on this
benchmark's own distribution; the frontier models saw it cold. So the honest
reading is narrower than "scale was never the scarce ingredient". It is that
**in-domain signal can substitute for scale on the distribution it was trained
on**, which is an older and smaller claim, and the experiment that would
settle the bigger one — fine-tune a frontier model too, or test the 7B on
something else — is not in the paper.

Even so, look at where the signal came from. Not a dataset somebody
commissioned. Eleven years of a mailing list that existed for entirely other
reasons.

Now take Perona, at Caltech. His talk was called *Communities of knowledge and
scientific consensus in the age of agentic AI*, and the idea I took from it is
that a model can be the thing a community argues *through* rather than the
thing that replaces the arguing.

His two examples are apps you can install: iNaturalist, for identifying any
plant or animal, and Merlin Bird ID, from the Cornell Lab of Ornithology. Both
grew out of Visipedia, a project he began with Serge Belongie in 2010 on the
premise that pictures should be first-class citizens alongside text, and that
experts and algorithms should teach each other.

Look at what the training signal is there. It is not a labelled dataset
somebody commissioned either. It is millions of amateurs photographing things
and a smaller number of experts correcting them, with the model in the middle,
getting better as the community argues its way toward consensus.

Finkbeiner closed the loop from the other end. He is a neurologist at UCSF and
Gladstone who invented robotic microscopy for longitudinal single-cell
analysis — automated instruments that track the *same* cell for days or
months, rather than photographing a population once.

His line that I wrote down twice: progress lies in causal insight extracted
from good data. Watching one cell over time tells you what killed it. A
snapshot of a thousand cells tells you what dying cells look like, which is
not the same thing and is much less useful.

And his pathology work does the thing everybody says and few build. Clinical
data goes back into the training set, so the model's mistakes in the clinic
become the next round of supervision.

Three rooms and three vocabularies turned out to share one architecture. The
model is downstream. The question that decides everything is who or what
generates the corrections.

## 2. Thirty-Four Minutes of the Thirty-Nine

The second thread of the day was a harder version of the same problem. Arguing
on a forum is already text, so a model can be scored against it directly. A
physical experiment is not. How do you turn a laboratory bench into something
an agent can both act on and be checked against?

One answer is to make the agent good enough at the computational half of the
work — the *dry lab*, the analysis and planning you do at a desk — that only
the bench work, the *wet lab*, is left. That is Biomni, a general-purpose
biomedical agent built at Stanford, which ships with 150 specialised tools,
105 software packages and 59 databases and plans across all of them without
task-specific prompting.

Cong's group has a second answer, called LabOS, and it is the one I would not
have predicted. Instead of replacing the human, put the human in
augmented-reality glasses. The agent sees what the researcher sees, gives
step-by-step guidance, flags errors as they happen, and takes voice and
gesture back.

Making that work needed a model that can watch a bench. So they collected over
240 sessions of video shot from researchers' own heads during real
experiments, and used them to further train a vision-language model — a model
that takes an image and text together and answers questions about what it is
looking at.

The phrase Cong used, and I like it, is making the lab AI-operable and
AI-reproducible. *Reproducible* is the load-bearing word. If nothing observed
the bench, nothing can check what happened at it.

Sanfeng Wu's group at Princeton took the other road, and this was the talk
that made the room go quiet. They built a robotic minilab and put an agent
inside it.

<div class='figure'>
    <img src='/images/agentic-qumus-minilab.png'>
    <div class='caption'>
        <span class='caption-label'>Figure 3.</span>
        The Qumus minilab, reproduced from Shi et al. (2026), Figure 1(d). Two
        robot arms, a motorised scotch-tape exfoliator, temperature-controlled
        stages, storage tables and a microscope, on one optical bench. This is
        a photograph, so it keeps its own colours. The scotch tape is not a
        joke: peeling graphene off graphite with adhesive tape is how the
        material is made.
    </div>
</div>

The system is called Qumus and it makes two-dimensional materials — sheets one
atom thick, peeled off a crystal and stacked. It has produced, according to
the paper, the first AI-created graphene and the first AI-fabricated
atomically thin transistor.

The detail I enjoyed most is the least glamorous. To let the agent act on the
bench at all, they trained an off-the-shelf object detector called YOLO on the
view from two overhead cameras, and then stuck **micro-QR codes on the
equipment**. They did not build a learned world model of the laboratory. They
stuck barcodes on it.

That is what defining an environment looks like in practice. The reason a
language model can be trained at all is that text arrives pre-tokenised by
writing. A bench does not. Somebody has to decide what the countable objects
are, and in 2026 the honest answer is a sheet of QR stickers.

Wu also pointed at the general robotics work this borrows from: OpenVLA, the
open vision-language-action model, and the world-model line of research now
appearing in open robotics toolkits. My notes have a project name here that I
have not been able to match to a real paper, so I will leave it as the
direction rather than invent a citation.

<div class='sketch'>
    <svg viewBox='0 0 720 384' role='img' aria-label='Six stages -- reason, hypothesize, plan, execute, observe, report -- arranged in a ring with arrows running clockwise, a request entering at the left and a result leaving at the bottom left.'>
      <path class='sk-s2' d='M71.7,172.8 Q109.8,173.2 147.9,172.8 Q155.9,172.8 155.9,180.8 Q156.6,189.9 155.9,199.0 Q155.9,207.0 147.9,207.0 Q109.8,206.5 71.7,207.0 Q63.7,207.0 63.7,199.0 Q64.1,189.9 63.7,180.8 Q63.7,172.8 71.7,172.8'/>
      <path class='sk-s2' d='M71.6,173.7 Q109.5,172.9 147.3,173.7 Q155.3,173.7 155.3,181.7 Q155.9,190.4 155.3,199.0 Q155.3,207.0 147.3,207.0 Q109.5,206.5 71.6,207.0 Q63.6,207.0 63.6,199.0 Q63.1,190.4 63.6,181.7 Q63.6,173.7 71.6,173.7'/>
      <text class='sk-t' x='110.0' y='195.0' text-anchor='middle'>reason</text>
      <path class='sk-s2' d='M173.5,60.7 Q234.5,60.5 295.6,60.7 Q303.6,60.7 303.6,68.7 Q303.5,77.1 303.6,85.6 Q303.6,93.6 295.6,93.6 Q234.5,94.2 173.5,93.6 Q165.5,93.6 165.5,85.6 Q166.3,77.1 165.5,68.7 Q165.5,60.7 173.5,60.7'/>
      <path class='sk-s2' d='M174.4,60.3 Q235.4,59.4 296.5,60.3 Q304.5,60.3 304.5,68.3 Q304.2,77.1 304.5,86.0 Q304.5,94.0 296.5,94.0 Q235.4,94.7 174.4,94.0 Q166.4,94.0 166.4,86.0 Q166.6,77.1 166.4,68.3 Q166.4,60.3 174.4,60.3'/>
      <text class='sk-t' x='235.0' y='82.4' text-anchor='middle'>hypothesize</text>
      <path class='sk-s2' d='M456.5,60.1 Q484.7,59.7 512.9,60.1 Q520.9,60.1 520.9,68.1 Q520.0,77.6 520.9,87.0 Q520.9,95.0 512.9,95.0 Q484.7,95.3 456.5,95.0 Q448.5,95.0 448.5,87.0 Q449.4,77.6 448.5,68.1 Q448.5,60.1 456.5,60.1'/>
      <path class='sk-s2' d='M455.7,60.5 Q484.6,61.4 513.5,60.5 Q521.5,60.5 521.5,68.5 Q520.8,77.6 521.5,86.6 Q521.5,94.6 513.5,94.6 Q484.6,94.1 455.7,94.6 Q447.7,94.6 447.7,86.6 Q447.7,77.6 447.7,68.5 Q447.7,60.5 455.7,60.5'/>
      <text class='sk-t' x='485.0' y='82.4' text-anchor='middle'>plan</text>
      <path class='sk-mark' d='M566.9,173.3 Q609.7,172.4 652.6,173.3 Q660.6,173.3 660.6,181.3 Q660.4,190.5 660.6,199.8 Q660.6,207.8 652.6,207.8 Q609.7,207.3 566.9,207.8 Q558.9,207.8 558.9,199.8 Q558.0,190.5 558.9,181.3 Q558.9,173.3 566.9,173.3'/>
      <path class='sk-mark' d='M567.7,172.9 Q609.7,172.0 651.7,172.9 Q659.7,172.9 659.7,180.9 Q660.1,189.8 659.7,198.7 Q659.7,206.7 651.7,206.7 Q609.7,206.0 567.7,206.7 Q559.7,206.7 559.7,198.7 Q558.8,189.8 559.7,180.9 Q559.7,172.9 567.7,172.9'/>
      <text class='sk-t' x='610.0' y='195.0' text-anchor='middle'>execute</text>
      <path class='sk-s2' d='M443.3,285.4 Q485.8,284.5 528.4,285.4 Q536.4,285.4 536.4,293.4 Q536.5,302.1 536.4,310.8 Q536.4,318.8 528.4,318.8 Q485.8,318.4 443.3,318.8 Q435.3,318.8 435.3,310.8 Q435.8,302.1 435.3,293.4 Q435.3,285.4 443.3,285.4'/>
      <path class='sk-s2' d='M442.4,285.8 Q485.0,286.1 527.6,285.8 Q535.6,285.8 535.6,293.8 Q536.5,303.1 535.6,312.4 Q535.6,320.4 527.6,320.4 Q485.0,319.5 442.4,320.4 Q434.4,320.4 434.4,312.4 Q435.3,303.1 434.4,293.8 Q434.4,285.8 442.4,285.8'/>
      <text class='sk-t' x='485.0' y='307.6' text-anchor='middle'>observe</text>
      <path class='sk-s2' d='M197.0,285.3 Q234.7,286.2 272.5,285.3 Q280.5,285.3 280.5,293.3 Q280.0,302.8 280.5,312.3 Q280.5,320.3 272.5,320.3 Q234.7,320.6 197.0,320.3 Q189.0,320.3 189.0,312.3 Q189.1,302.8 189.0,293.3 Q189.0,285.3 197.0,285.3'/>
      <path class='sk-s2' d='M196.5,284.9 Q234.7,284.0 272.9,284.9 Q280.9,284.9 280.9,292.9 Q281.7,302.6 280.9,312.3 Q280.9,320.3 272.9,320.3 Q234.7,320.4 196.5,320.3 Q188.5,320.3 188.5,312.3 Q189.2,302.6 188.5,292.9 Q188.5,284.9 196.5,284.9'/>
      <text class='sk-t' x='235.0' y='307.6' text-anchor='middle'>report</text>
      <path class='sk-thin' d='M153.7,150.8 Q160.8,141.8 170.5,135.5'/>
      <path class='sk-thin' d='M153.9,150.0 Q162.9,143.1 171.1,135.3'/>
      <path class='sk-thin' d='M170.9,135.1 Q169.9,138.2 168.6,141.3'/>
      <path class='sk-thin' d='M170.4,135.0 Q167.5,135.9 164.7,136.9'/>
      <path class='sk-thin' d='M317.2,77.7 Q374.0,77.5 430.8,77.9'/>
      <path class='sk-thin' d='M317.0,77.8 Q374.1,78.1 431.3,77.4'/>
      <path class='sk-thin' d='M430.9,77.9 Q428.1,79.5 425.8,81.7'/>
      <path class='sk-thin' d='M431.5,77.6 Q428.7,75.8 426.0,73.8'/>
      <path class='sk-thin' d='M521.7,110.6 Q540.2,128.9 560.4,145.2'/>
      <path class='sk-thin' d='M521.9,110.0 Q541.4,126.7 559.8,144.8'/>
      <path class='sk-thin' d='M559.8,144.6 Q556.1,144.6 552.4,143.7'/>
      <path class='sk-thin' d='M559.6,145.1 Q558.7,141.8 558.2,138.3'/>
      <path class='sk-thin' d='M563.4,233.0 Q548.5,244.4 534.5,256.8'/>
      <path class='sk-thin' d='M562.3,232.3 Q547.1,242.8 535.5,257.2'/>
      <path class='sk-thin' d='M534.6,257.3 Q535.8,254.0 537.7,251.0'/>
      <path class='sk-thin' d='M535.3,257.9 Q538.3,256.4 541.6,255.8'/>
      <path class='sk-thin' d='M421.8,303.0 Q359.8,304.8 297.8,303.0'/>
      <path class='sk-thin' d='M420.9,302.5 Q359.7,300.6 298.5,303.3'/>
      <path class='sk-thin' d='M298.2,303.1 Q300.6,300.8 303.4,299.2'/>
      <path class='sk-thin' d='M298.2,302.6 Q301.1,304.5 304.2,305.9'/>
      <path class='sk-thin' d='M191.3,263.5 Q173.4,248.0 156.3,231.5'/>
      <path class='sk-thin' d='M191.8,262.6 Q172.9,248.4 156.4,231.5'/>
      <path class='sk-thin' d='M157.0,231.4 Q160.0,231.8 163.0,232.8'/>
      <path class='sk-thin' d='M156.3,231.8 Q157.0,235.4 158.1,238.9'/>
      <text class='sk-t' x='360.0' y='186.0' text-anchor='middle'>an AI experimentalist</text>
      <text class='sk-sub' x='360.0' y='208.0' text-anchor='middle'>the loop Qumus closes with nobody in the room</text>
      <path class='sk-thin' d='M13.9,189.4 Q32.3,189.3 50.8,190.2'/>
      <path class='sk-thin' d='M13.8,189.5 Q32.6,189.9 51.5,189.7'/>
      <path class='sk-thin' d='M51.6,189.7 Q48.6,190.7 45.9,192.4'/>
      <path class='sk-thin' d='M50.7,189.7 Q47.9,189.0 45.4,187.6'/>
      <text class='sk-lbl' x='10.0' y='160.0' text-anchor='start'>a request</text>
      <path class='sk-thin' d='M214.9,322.2 Q180.4,333.1 146.5,345.9'/>
      <path class='sk-thin' d='M215.7,321.3 Q180.9,333.3 146.9,347.2'/>
      <path class='sk-thin' d='M147.5,345.9 Q149.6,344.3 151.4,342.2'/>
      <path class='sk-thin' d='M146.5,346.5 Q149.4,347.3 152.4,347.9'/>
      <text class='sk-lbl' x='139.0' y='352.6' text-anchor='end'>a result</text>
      <text class='sk-note' x='706.0' y='244.0' text-anchor='end'>seven eighths of the</text>
      <text class='sk-note' x='706.0' y='264.0' text-anchor='end'>wall clock is here</text>
      <path class='sk-faint' d='M693.7,229.3 Q674.3,220.5 654.8,212.2'/>
      <circle class='qm-dot' cx='110' cy='190' r='6'/>
    </svg>
    <div class='caption'>
        <span class='caption-label'>Figure 4.</span>
        The loop an AI experimentalist closes, redrawn from Qumus Figure 1(a).
        The travelling dot is not decorating the picture. It whips through five
        stages and then holds on <b>execute</b> for seven eighths of every
        turn, in the proportion the paper's own stopwatch reports. The next
        figure is about what that does and does not cost you.
    </div>
</div>

Now the number that reframed the day for me. The Qumus paper reports the time
breakdown for one complete task, which was to fetch the user a graphene flake,
running on a version of the system driven by Claude Sonnet 4.6. The whole
thing took 39 minutes and 32 seconds. Of that, the model spent 59 seconds
reasoning and 3 minutes 49 seconds looking at what it had done. The remaining
34 minutes and 44 seconds were instruments moving.

The model thinks for **2.5% of the wall clock**. Everything else is a machine
moving.

The paper says as much in its own discussion: "the primary bottlenecks
currently constraining our system are instrumental rather than algorithmic."
I wanted to know what that costs you, so I put their numbers into the oldest
tool for the question.

<div class='knob' id='am-knob'>
    <div class='controls'>
        <label for='am-r'>make the reasoning faster by</label>
        <input id='am-r' type='range' min='1' max='100' step='1' value='1'>
        <span class='readout' id='am-r-out'>1&#215;</span>
    </div>
    <div class='controls'>
        <label for='am-m'>make the instruments faster by</label>
        <input id='am-m' type='range' min='1' max='10' step='1' value='1'>
        <span class='readout' id='am-m-out'>1&#215;</span>
    </div>
    <svg viewBox='0 0 720 208' role='img' aria-label='Two horizontal bars showing where the time goes in one Qumus task, the upper one as measured and the lower one after the reader speeds up reasoning and instruments.'>
        <g id='am-legend'></g>
        <text class='axlabel' x='30' y='58' text-anchor='start'>as measured, 39:32</text>
        <g id='am-row1'></g>
        <text class='wnum' id='am-total' x='690' y='122' text-anchor='end'></text>
        <text class='axlabel' x='30' y='128' text-anchor='start'>with your speed-ups</text>
        <g id='am-row2'></g>
        <line class='axis' x1='30' y1='178' x2='690' y2='178'/>
        <g id='am-ticks'></g>
    </svg>
    <p class='note' id='am-note'></p>
    <script>
    (function () {
      var R = 59, E = 2084, O = 229, TOT = R + E + O;   // seconds, Qumus Fig. 2f
      var X0 = 30, X1 = 690, PX = (X1 - X0) / TOT;
      var COL = ['#8C77BC', '#3E6491', '#C48BAC'];
      var rIn = document.getElementById('am-r'), mIn = document.getElementById('am-m');
      var rOut = document.getElementById('am-r-out'), mOut = document.getElementById('am-m-out');
      var row1 = document.getElementById('am-row1'), row2 = document.getElementById('am-row2');
      var legend = document.getElementById('am-legend'), ticks = document.getElementById('am-ticks');
      var total = document.getElementById('am-total'), note = document.getElementById('am-note');
      function mmss(s) {
        var m = Math.floor(s / 60), r = Math.round(s - m * 60);
        if (r === 60) { m += 1; r = 0; }
        return m + ':' + (r < 10 ? '0' : '') + r;
      }
      function bars(g, parts, y) {
        var s = '', x = X0, i, w;
        for (i = 0; i < parts.length; i++) {
          w = parts[i] * PX;
          s += "<rect x='" + x.toFixed(1) + "' y='" + y + "' width='"
             + Math.max(w, 0.7).toFixed(1) + "' height='30' fill='" + COL[i] + "'/>";
          x += w;
        }
        g.innerHTML = s;
      }
      // Legend, ticks and the measured bar never move, so they are drawn once.
      var items = [['reasoning ' + mmss(R), 30],
                   ['instrument execution ' + mmss(E), 214],
                   ['observation ' + mmss(O), 486]];
      (function () {
        var s = '', i;
        for (i = 0; i < items.length; i++) {
          s += "<rect x='" + items[i][1] + "' y='12' width='13' height='13' fill='"
             + COL[i] + "'/>"
             + "<text class='tick' x='" + (items[i][1] + 19) + "' y='24'"
             + " text-anchor='start'>" + items[i][0] + "</text>";
        }
        legend.innerHTML = s;
        s = '';
        for (i = 0; i <= 30; i += 10) {
          var x = X0 + i * 60 * PX;
          s += "<line class='grid' x1='" + x.toFixed(1) + "' y1='178' x2='"
             + x.toFixed(1) + "' y2='183'/>"
             + "<text class='tick' x='" + x.toFixed(1) + "' y='198'"
             + " text-anchor='middle'>" + (i === 30 ? '30 min' : i) + "</text>";
        }
        s += "<line class='grid' x1='" + X1 + "' y1='178' x2='" + X1
           + "' y2='183'/>"
           + "<text class='tick' x='" + X1 + "' y='198' text-anchor='end'>"
           + mmss(TOT) + "</text>";
        ticks.innerHTML = s;
        bars(row1, [R, E, O], 66);
      })();
      function draw() {
        var r = +rIn.value, m = +mIn.value;
        var T = R / r + (E + O) / m, sp = TOT / T;
        bars(row2, [R / r, E / m, O / m], 136);
        rOut.innerHTML = r + '&#215;';
        mOut.innerHTML = m + '&#215;';
        total.textContent = mmss(T) + '  (' + sp.toFixed(2) + '× faster)';
        var ceiling = TOT / (E + O);
        note.textContent = 'Reasoning is ' + R + ' s of ' + TOT + '. With the hardware'
          + ' as it is, a model that thought instantly would finish in '
          + mmss(E + O) + ', a speed-up of ' + ceiling.toFixed(2) + '× -- that is'
          + ' the ceiling the first slider is pushing against. Your instruments are'
          + ' currently ' + m + '× faster, which is worth '
          + (TOT / (R + (E + O) / m)).toFixed(2) + '× on its own.';
      }
      rIn.addEventListener('input', draw);
      mIn.addEventListener('input', draw);
      draw();
    })();
    </script>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 5.</span>
    Amdahl's law on a real bench, split into
    <span style='color:#8C77BC'><b>reasoning</b></span>,
    <span style='color:#3E6491'><b>instrument execution</b></span> and
    <span style='color:#C48BAC'><b>observation</b></span>. Drag the first
    slider all the way and the bar barely moves; drag the second and the whole
    thing collapses. Every number here is computed from the paper's own
    seconds. Read it as a bound on one pass through the task, not on what a
    better model is worth &mdash; that argument is below the figure.
</div>

Drag the first slider to the top and watch nothing happen. That is Amdahl's
law, which says a speed-up applied to part of a job is capped by the part you
did not speed up, and the arithmetic here is not subtle. If reasoning is 59
seconds out of 2,372, then a model that thinks instantly still finishes in
2,313 seconds, which is a speed-up of 1.03×. Making the model a hundred times
*faster* buys you two and a half percent.

Now the objection, which is the one I would raise if somebody showed me this
slide, and it is serious enough that I want it in the post rather than in a
footnote. **Amdahl bounds the time per experiment. The thing a better model
changes is the number of experiments.**

The evidence is in this very paper. Qumus got its flake on the fifth run,
having revised its parameters after each of the first four. A model that
guessed better and got there in two runs would cut the wall clock by three
fifths — a 2.5× win, against the 1.03× that speeding up its thinking can ever
deliver. Model quality pays in the loop, and the stopwatch is pointed at a
single pass through it.

There is a familiar version of this. The optimizer step is a tiny fraction of
the wall clock in language-model training, and nobody concludes from that that
better optimizers are worth two percent. A better optimizer changes how many
steps you need.

Three more things the measurement cannot see. Instrument time parallelises
across benches and runs overnight, so it is the cheap resource in a lab that
owns ten of them, while a bad decision costs a day whichever bench it was made
on. The 2.5% is partly a configuration choice, because a heavier reasoning
model given a larger thinking budget would spend far longer than 59 seconds.
And the task was picked for a bounded recipe space, which is exactly the
regime where there is least to think about.

So what does the stopwatch actually establish? Only this, and it is still
worth having. For one pass through one bounded task, on hardware as it exists
in 2026, no amount of extra thinking *speed* is worth more than three percent.
Everything else you might want has to come from better decisions or from
faster machines, and this measurement does not price either of them.

## 3. Hypotheses Cheap Enough to Throw Away

The last thread was the most abstract and, I suspect, the most important.

Daniel Acker runs agentic AI at Flagship Pioneering, and his talk was called
*Scaling Scientific Reasoning*. As I understood it, his argument has four
moves, and I will give them in his order because the order is the argument.
Each one needs unpacking, so let me take them one at a time.

**Models are hypotheses written as executable code.** A guess about how a
disease works can be written down as a small simulation with parameters in it.
Once it is code, it makes predictions, and predictions can be wrong in public.

**Falsifying them against data shrinks the hypothesis space.** Run the code,
compare it against a measurement, and the ones that disagree are gone. That is
the ordinary business of science, except that it now costs a machine's time
rather than a person's.

**No human can reason across the whole of that space.** A biologist holds two
or three mechanisms in mind and picks the one that feels most likely. The
space of mechanisms consistent with the data is far larger than that, and the
part nobody examined is where the answer often is.

**Language models make biology computable at the scale where you could try.**
This is the move the other three were building toward. If writing a candidate
mechanism as code is cheap, you can write hundreds.

So the proposal is to generate a large ensemble of candidate causal models,
run them all against the data, and keep whatever survives. Not one favoured
mechanism but many, chosen to be as different from each other as possible.
Considering the alternatives together, he argued, is what raises conviction,
and the models that compete with the favourite are the ones pointing past the
edge of what is currently known.

His summary was that scaled reasoning systematically converts uncertainty into
risk. That sentence is doing real work. Uncertainty is not knowing what you do
not know. Risk is a quantity with a number on it. A venture firm cares about
that distinction more than most.

Shunzhi Wang, at NYU, gave the version of this you can hold. He designs
protein assemblies — his first-author *Nature* paper this year is on
quasisymmetric protein cages, shells built from pentagons and hexagons the way
a virus builds a capsid. He described searching the space of design choices
with Monte Carlo tree search, which explores a tree of decisions by playing
many rollouts forward and spending its next try where the results so far look
most promising. And he described co-designing *with* agents rather than
dispatching tasks to them.

The idea he described that I keep turning over is a designed particle that
packages its own genetic blueprint. Directed evolution works by keeping
whatever performs best and breeding from it, which only works if you can trace
a good performance back to the instructions that produced it. A particle
carrying its own instructions gives you exactly that link, so the
design–test–learn loop closes by itself and you can select rather than
analyse. That is what could make an ensemble of hypotheses cheap enough to be
worth generating.

I did not want to take the ensemble argument on faith, so I built the smallest
model of it I could and ran it.

Suppose an agent proposes $M$ candidate causal models. Each proposal is the
true mechanism with probability $p$ — call that the generator's **coverage** —
and a wrong one otherwise. Then you run $E$ falsifying experiments, each of
which rules out any given wrong model with probability $q$, so a wrong model
survives all of them with probability $s = (1-q)^E$. The true model is never
ruled out.

Everything in that setup is independent: the proposals from each other, the
experiments from each other, and each wrong model's fate from every other
model's. Those are strong assumptions and they cut both ways, so I will come
back to them once there is something to say about them.

Three quantities have closed forms, meaning I can write each as a formula
rather than having to estimate it by running the process. The truth is
somewhere in the ensemble with probability $1 - (1-p)^M$. You finish with the
right model and no surviving rivals with probability

$$\left(1 - (1-p)s\right)^M - \left((1-p)(1-s)\right)^M,$$

and you finish *committed to a wrong model* — truth absent, a rival still
standing — with probability

$$(1-p)^M - \left((1-p)(1-s)\right)^M.$$

The middle expression comes from summing over how many of the $M$ proposals
happened to be the true one, which is a binomial count. I checked all three
against a 200,000-trial simulation and the largest disagreement was 0.002.

<div class='knob' id='en-knob'>
    <div class='controls'>
        <label for='en-p'>coverage: how often a proposal is the true mechanism</label>
        <input id='en-p' type='range' min='0' max='10' step='0.5' value='3'>
        <span class='readout' id='en-p-out'></span>
    </div>
    <div class='controls'>
        <label for='en-e'>falsifying experiments run</label>
        <input id='en-e' type='range' min='0' max='12' step='1' value='8'>
        <span class='readout' id='en-e-out'></span>
    </div>
    <div class='controls'>
        <label for='en-m'>models in the ensemble</label>
        <input id='en-m' type='range' min='1' max='200' step='1' value='60'>
        <span class='readout' id='en-m-out'></span>
    </div>
    <svg viewBox='0 0 720 300' role='img' aria-label='Three curves against ensemble size: the probability the truth is somewhere in the ensemble, the probability it is the only model left standing, and the probability of finishing committed to a wrong one.'>
        <g id='en-grid'></g>
        <line class='axis' x1='70' y1='248' x2='560' y2='248'/>
        <line class='axis' x1='70' y1='30' x2='70' y2='248'/>
        <polyline class='trace-present' id='en-present' points=''/>
        <polyline class='trace-good' id='en-clean' points=''/>
        <polyline class='trace-bad' id='en-wrong' points=''/>
        <line class='ref' id='en-mark' x1='0' y1='30' x2='0' y2='248'/>
        <circle id='en-dot-p' cx='0' cy='0' r='4.5' fill='#3E6491'/>
        <circle id='en-dot-c' cx='0' cy='0' r='4.5' fill='#8C77BC'/>
        <circle id='en-dot-w' cx='0' cy='0' r='4.5' fill='#A8443E'/>
        <text class='lab-present' id='en-lab-p' x='572' y='0' text-anchor='start'>truth in hand</text>
        <text class='lab-good' id='en-lab-c' x='572' y='0' text-anchor='start'>right answer alone</text>
        <text class='lab-bad' id='en-lab-w' x='572' y='0' text-anchor='start'>wrong answer</text>
        <g id='en-ticks'></g>
        <text class='axlabel' x='315' y='292' text-anchor='middle'>models in the ensemble</text>
        <text class='axlabel' x='18' y='139' text-anchor='middle' transform='rotate(-90 18 139)'>probability</text>
    </svg>
    <p class='note' id='en-note'></p>
    <script>
    (function () {
      var X0 = 70, X1 = 560, Y0 = 248, Y1 = 30, MMAX = 200, Q = 0.5;
      var pIn = document.getElementById('en-p'), eIn = document.getElementById('en-e'),
          mIn = document.getElementById('en-m');
      var pOut = document.getElementById('en-p-out'), eOut = document.getElementById('en-e-out'),
          mOut = document.getElementById('en-m-out');
      var present = document.getElementById('en-present'),
          clean = document.getElementById('en-clean'), wrong = document.getElementById('en-wrong'),
          mark = document.getElementById('en-mark'), dotP = document.getElementById('en-dot-p'),
          dotC = document.getElementById('en-dot-c'), dotW = document.getElementById('en-dot-w'),
          grid = document.getElementById('en-grid'), ticks = document.getElementById('en-ticks'),
          note = document.getElementById('en-note');
      var labs = [document.getElementById('en-lab-p'), document.getElementById('en-lab-c'),
                  document.getElementById('en-lab-w')];
      // The closed forms derived in the post. s is the chance a wrong model
      // survives every experiment; the true model always survives. `dead` is
      // the fourth outcome, where every hypothesis is falsified -- which is
      // the alarm, not a failure, so the note reports it.
      function probs(M, p, s) {
        var dead = Math.pow((1 - p) * (1 - s), M);
        return {present: 1 - Math.pow(1 - p, M),
                clean: Math.pow(1 - (1 - p) * s, M) - dead,
                wrong: Math.pow(1 - p, M) - dead,
                dead: dead};
      }
      function px(M) { return X0 + (M - 1) / (MMAX - 1) * (X1 - X0); }
      function py(v) { return Y0 - v * (Y0 - Y1); }
      (function () {
        var s = '', i, y, x;
        for (i = 0; i <= 4; i++) {
          y = py(i / 4);
          s += "<line class='grid' x1='" + X0 + "' y1='" + y.toFixed(1)
             + "' x2='" + X1 + "' y2='" + y.toFixed(1) + "'/>";
        }
        grid.innerHTML = s;
        s = '';
        for (i = 0; i <= 4; i++) {
          y = py(i / 4);
          s += "<text class='tick' x='60' y='" + (y + 5).toFixed(1)
             + "' text-anchor='end'>" + (i * 25) + '%' + "</text>";
        }
        var xs = [1, 50, 100, 150, 200];
        for (i = 0; i < xs.length; i++) {
          x = px(xs[i]);
          s += "<text class='tick' x='" + x.toFixed(1)
             + "' y='270' text-anchor='middle'>" + xs[i] + "</text>";
        }
        ticks.innerHTML = s;
      })();
      // Three labels at the right-hand ends of three curves. They are clamped
      // inside the plot and then pushed apart, because two of the curves meet
      // whenever coverage is high and all three meet when it is zero.
      function place(ys) {
        var order = [0, 1, 2].sort(function (a, b) { return ys[a] - ys[b]; });
        var out = [], last = -1e9, i, y;
        for (i = 0; i < order.length; i++) {
          y = Math.max(ys[order[i]], Y1 + 6);
          if (y - last < 18) { y = last + 18; }
          last = y;
          out[order[i]] = y;
        }
        // Pushing apart can drive the lowest label onto the x-axis ticks when
        // two curves both end at zero, so shift the whole group back up.
        var over = last - (Y0 - 6);
        if (over > 0) { for (i = 0; i < 3; i++) { out[i] -= over; } }
        return out;
      }
      function draw() {
        var p = +pIn.value / 100, E = +eIn.value, M = +mIn.value;
        var s = Math.pow(1 - Q, E);
        var a = '', b = '', c = '', M2, r, best = 1, bestV = -1, i;
        for (M2 = 1; M2 <= MMAX; M2++) {
          r = probs(M2, p, s);
          a += px(M2).toFixed(1) + ',' + py(r.present).toFixed(1) + ' ';
          b += px(M2).toFixed(1) + ',' + py(r.clean).toFixed(1) + ' ';
          c += px(M2).toFixed(1) + ',' + py(r.wrong).toFixed(1) + ' ';
          if (r.clean > bestV) { bestV = r.clean; best = M2; }
        }
        present.setAttribute('points', a);
        clean.setAttribute('points', b);
        wrong.setAttribute('points', c);
        var end = probs(MMAX, p, s), cur = probs(M, p, s);
        var ys = place([py(end.present), py(end.clean), py(end.wrong)]);
        for (i = 0; i < 3; i++) { labs[i].setAttribute('y', (ys[i] + 5).toFixed(1)); }
        mark.setAttribute('x1', px(M).toFixed(1));
        mark.setAttribute('x2', px(M).toFixed(1));
        dotP.setAttribute('cx', px(M).toFixed(1));
        dotP.setAttribute('cy', py(cur.present).toFixed(1));
        dotC.setAttribute('cx', px(M).toFixed(1));
        dotC.setAttribute('cy', py(cur.clean).toFixed(1));
        dotW.setAttribute('cx', px(M).toFixed(1));
        dotW.setAttribute('cy', py(cur.wrong).toFixed(1));
        pOut.textContent = 'p = ' + (+pIn.value).toFixed(1) + '%';
        eOut.textContent = E + (E === 1 ? ' experiment' : ' experiments');
        mOut.textContent = 'M = ' + M;
        var tail = p === 0
          ? ' The generator cannot propose the truth at all, so every extra'
            + ' model is one more chance a wrong one survives. Notice the other '
            + (100 * cur.dead).toFixed(1) + '% of runs, though: every hypothesis'
            + ' dies, and the ensemble is telling you it is broken.'
          : (best >= MMAX
             ? ' The right answer is still becoming more likely at 200 models.'
             : ' Past ' + best + ' models you stop getting a unique answer and'
               + ' start getting a shortlist, while the wrong-answer rate keeps'
               + ' falling.');
        note.textContent = 'With ' + M + ' models, the truth is somewhere in the'
          + ' ensemble ' + (100 * cur.present).toFixed(1) + '% of the time, is the'
          + ' only model left standing ' + (100 * cur.clean).toFixed(1) + '% of the'
          + ' time, and you finish committed to a wrong model '
          + (100 * cur.wrong).toFixed(1) + '% of the time. Each experiment rules'
          + ' out half the wrong models.' + tail;
      }
      pIn.addEventListener('input', draw);
      eIn.addEventListener('input', draw);
      mIn.addEventListener('input', draw);
      draw();
    })();
    </script>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 6.</span>
    What an ensemble of causal models actually buys you.
    <span style='color:#3E6491'><b>Truth in hand</b></span> is the chance the
    right model is somewhere in what survives;
    <span style='color:#8C77BC'><b>right answer alone</b></span> is the chance
    it is the only thing left standing; and
    <span style='color:#A8443E'><b>wrong answer</b></span> is the chance you
    finish committed to something false. All three come from the closed forms
    above, which I checked against a 200,000-trial simulation. Watch the gap
    open between the first two curves: that gap is a shortlist, not a failure.
    Then set coverage to zero and read the note.
</div>

Three things fall out, and the first supports Acker.

With even a small coverage the ensemble really does convert uncertainty into
arithmetic. At $p = 0.03$, twenty proposals contain the truth 45.6% of the
time and a hundred contain it 95.2%. That is exponential, it is cheap, and it
is the whole case for generating many models instead of one.

The second thing looks at first like a problem and is not. Hold $p = 0.03$,
$q = 0.5$ and eight experiments, and the chance of finishing with exactly one
model standing, and it being the right one, peaks at **72 models** and falls
after that. I initially read that as a limit on how many hypotheses are worth generating.
It is not.

Follow where the lost probability goes. At 72 models you finish committed to a
wrong answer 2.7% of the time, and at 200 models
that is 0.1%. What you lose is *uniqueness*, not accuracy. Past the peak the
ensemble stops handing you one answer and starts handing you a shortlist with
the truth in it, which is not a failure — it is an instruction to run the ninth
experiment.

The third thing is what I would ask him about. **Set coverage to zero and the
red curve climbs.** If the true mechanism is outside anything the generator can
propose, adding models does not leave you agnostic. At twenty models you
finish confidently wrong 7.5% of the time, and at a hundred, 32.4%.

To its credit, the method does tell you when this is happening, and I nearly
missed that. In the other 67.6% of those runs at a hundred models, *every
single hypothesis is falsified* — which is the loudest signal a generator can
send that it cannot reach the answer. The failure mode is not silent. It is
only silent if nobody is watching for an empty ensemble.

Now back to those independence assumptions, because they do not cut evenly.
The one I would attack first is that each wrong model's fate is independent of
every other's. Real wrong hypotheses come in families, and one good experiment
kills a whole family at once, which would make survivors near-duplicates
rather than independent lucky escapes.

But the assumption that proposals are independent draws is if anything
*kinder* to Acker than reality. A language model sampled repeatedly returns
correlated hypotheses, so the real $1 - (1-p)^M$ curve saturates well below
what the widget draws. The setup is also one-shot, while his actual proposal
is a loop that regenerates conditioned on what died, which this cannot
represent at all.

So the model does not refute the programme, and it was never going to. What it
does is name the quantity everything turns on. Coverage decides whether the
ensemble is a machine for converting uncertainty into risk or a machine for
manufacturing confidence, and I would want to ask him how you measure it.

## 4. The Box Was Drawn by People

An audience member asked Acker the best question of the day. Can the model
have initiative? Can it find the question rather than answer it?

I do not think anybody has shown this, and I want to be precise about why it
is hard. Every system described today was scored against something a human
supplied — a benchmark of expert answers, a community's consensus label, a
clinical outcome, a target material. Initiative means choosing what to be
scored on, and none of the evaluation machinery in this field currently has a
place to put that.

Three other things I am still chewing on.

**The verifier problem.** Genome-Bench is built from what experts on a forum
said, so a model scoring 81% has learned to agree with that forum, including
wherever the forum was wrong. Language models are already tuned this way for
ordinary conversation, by scoring their answers against what people say they
prefer, and they inherit the preferences along with the knowledge. It is not a
criticism of the work — it is a bill that comes due later, when the model is
confident and the consensus was not right.

**The phrase *AI-created graphene*.** It is accurate and I still flinch at it.
What Qumus did is remarkable. It ran five experiments over four hours, revised
its parameters after each one, and finished with a flake larger than 200 µm²,
with nobody in the room. Elsewhere it recovered from a human yanking its chip
out mid-run, and from one of its own hallucinated labels.

But the task was specified, the recipe space was bounded, and the material was
known. That is autonomy inside a well-drawn box, and the box was drawn by
people.

**The economics.** For one pass through one task, the machinery owns 97.5% of
the clock, so buying a faster-thinking model buys almost nothing. What that
argues for is not a cheaper model. It argues that the question worth asking of
any of these systems is how many experiments it needed, which is the number
nobody put on a slide.

One last observation, and I want to state it carefully, because the obvious
version of it is wrong. Mengdi Wang, who co-directs AI², is an author on
Genome-Bench and on Qumus. Le Cong is first author on LabOS, and Sanfeng Wu
and Mengdi Wang are on it too. I am not going to draw a conclusion about
Princeton from that, since a workshop hosted by Princeton naturally features
Princeton people, and most of the work in my reference list is from somewhere
else entirely.

What I do draw from it is that the *method* transfers. The same people used
the same construction on a gene-editing bench and on a graphene bench, and it
worked twice.

But the method is not the whole of it. Qumus succeeds because
Wu's lab knows what a good flake looks like under a microscope and knows the
recipe space is bounded; Genome-Bench succeeds because somebody knew which
mailing list still contained real disagreement. The transferable part is the
construction. The domain expertise is what lets you draw the box in the first
place.

Which is why I recognised so much of it. The questions are the ones I already
had: where the signal comes from, what counts as a verifiable environment, and
how you keep an ensemble honest. The biology was the setting, not the subject.

## 5. Chat This Over With Friends

The one-sentence version is that AI for science has stopped being a modelling
problem and become an instrumentation problem. The number to bring is from the
Qumus robotic minilab at Princeton, which really did make graphene by itself.
Across one complete run of 39 minutes 32 seconds, the AI thought for 59
seconds and the machinery moved for the other 38 and a half minutes. Two and a
half percent of the wall clock is reasoning. So a model that thought instantly
would finish that job 1.03 times faster, and every other gain has to come out
of the hardware or out of needing fewer runs. The counterpart on the software
side is just as concrete: a 7-billion-parameter open model, trained by
reinforcement learning on eleven years of scientists arguing on a mailing
list, lands level with a frontier reasoning model on genomics questions.

The received version of this story, the one in the press releases, is that
bigger models will eventually do science. What is actually in short supply is a
world you can be graded against, which is why one of the most advanced
autonomous labs on earth runs on QR stickers and an object detector. The fair
objection to my own account is that a stopwatch measures the wrong thing: it
bounds the time per experiment, while what a better model really buys is fewer
experiments, and nobody at the workshop reported that number. What stays open
is the question an audience member asked and nobody could answer. Every one of
these systems is scored against a target a human chose, so none of them can
yet decide what is worth working on. That is a more interesting frontier than
the one in the press releases.

## 6. References

1. Boiko, D. A., MacKnight, R., Kline, B., and Gomes, G. (2023). *Autonomous
   chemical research with large language models.* Nature 624, 570–578.
   [nature.com](https://www.nature.com/articles/s41586-023-06792-0)
2. Qu, Y. et al. *CRISPR-GPT for agentic automation of gene-editing
   experiments.* Preprint 2024; Nature Biomedical Engineering (2025).
   [arXiv:2404.18021](https://arxiv.org/abs/2404.18021)
3. Yin, M., Qu, Y., Yang, L., Cong, L., and Wang, M. (2025). *Toward Scientific
   Reasoning in LLMs: Training from Expert Discussions via Reinforcement
   Learning.* The Genome-Bench paper.
   [arXiv:2505.19501](https://arxiv.org/abs/2505.19501)
4. Huang, K. et al. (2025). *Biomni: A General-Purpose Biomedical AI Agent.*
   bioRxiv.
   [biorxiv.org](https://www.biorxiv.org/content/10.1101/2025.05.30.656746v1)
5. Cong, L. et al. (2025). *LabOS: The AI-XR Co-Scientist That Sees and Works
   With Humans.* [arXiv:2510.14861](https://arxiv.org/abs/2510.14861)
6. Shi, L. et al. (2026). *Qumus: Realization of An Embodied AI Quantum
   Material Experimentalist.*
   [arXiv:2605.18407](https://arxiv.org/abs/2605.18407)
7. Kim, M. J. et al. (2024). *OpenVLA: An Open-Source Vision-Language-Action
   Model.* [arXiv:2406.09246](https://arxiv.org/abs/2406.09246)
8. Wang, S. et al. (2026). *De novo design of quasisymmetric two-component
   protein cages.* Nature 655, 251–258.
   [nature.com](https://www.nature.com/articles/s41586-026-10464-0)
9. Project Visipedia, Perona and Belongie. The line of work behind iNaturalist
   and Merlin Bird ID.
   [ai4science.caltech.edu](https://ai4science.caltech.edu/projects/visipedia.html)
10. Amdahl, G. M. (1967). *Validity of the single processor approach to
    achieving large scale computing capabilities.* AFIPS Conference
    Proceedings 30, 483–485.
