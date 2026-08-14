---
title: What the KV Cache Costs
subtitle: The buffer that makes generation affordable is the reason serving a language model is hard.
date: 2026-08-13
tags: llm
icon: 🍵
---

I wrote a post about [the KV cache](/blog/2026/08/13/kv-cache/), which is the
buffer that stops a language model from redoing all of its work every time it
writes a word. That post was about what the cache is and why it is allowed to
exist. This one is about what it costs, which turns out to be a much stranger
subject, and the one that actually occupies people who run these models for a
living.

I will not assume you have read the other post. The next few paragraphs give
you everything you need.

[TOC]

## What We Are Talking About

Let me give you the whole mechanism in a few paragraphs, so that nothing below
depends on your having read anything else.

A language model writes one **token** at a time — a token being a chunk of
text, roughly a word. To choose each one, it looks back over everything
written so far, and the looking-back is done by a mechanism called
**attention**. Attention turns every token into three lists of numbers. The
first says what that token is looking for, the second advertises what it has
to offer, and the third is the content it hands over. They are called the
**query**, the **key** and the **value**. The current token's query is
compared against every earlier token's key, and the resulting scores decide
how much of each value gets blended into the answer.

Two structural facts, because both show up in the arithmetic below. The model
does not run one copy of this across the full width of its vectors — it splits
the width into parallel pieces called **heads**, each with its own learned
projections. And it repeats the whole arrangement at every **layer**, stacked
dozens deep. Llama 3 70B has 80 layers. Modern models use fewer heads for keys
and values than for queries, which is why I will write $n_{kv}$ for the
key-value head count and mention separately that there are usually four or
eight times as many query heads.

Now the important part. A token's key and value depend only on that token and
the ones before it, so once computed they never change. Its query does not
have that property in any useful sense, because a query is used once, at the
step it belongs to, and is never wanted again. So there is an obvious saving
available: store every token's key and value, and reuse them at every later
step instead of recomputing them. That store is the **KV cache**, and it is
the difference between generation costing you the square of the answer's
length and costing you something close to linear in it. I wrote a whole post
about [what it is and why it works](/blog/2026/08/13/kv-cache/); this one
takes it as given.

Per layer, per conversation, the cache holds two tensors of shape
$n_{kv} \times t \times d_h$, where $t$ counts the tokens seen so far and
$d_h$ is how many numbers are in one key. Read that as a stack of rows, one
row per token. Multiply it out over $L$ layers, at $p$ bytes a number, and one
conversation is holding

$$
2 \, L \, n_{kv} \, d_h \, t \, p \quad \text{bytes.}
$$

For Llama 3 8B, with 32 layers, 8 key-value heads and 128 numbers per head,
that comes to 128 KiB for every token. For Llama 3 70B it is 320 KiB, so a
conversation that fills its 128K-token context window — 131,072 tokens, since
these are always powers of two — is sitting on exactly 40 GiB. A **context
window** is just the model's limit on how much text it can consider at once.

Two things about that number matter, and the whole of this post is really
about the second. The first is that it is large. The second is that it belongs
to *one conversation*, and nobody else can touch it.

One last piece of vocabulary, since I will lean on it. Answering happens in
two phases that behave nothing alike. **Prefill** is the model reading your
prompt, which it can do in one pass because the whole prompt is already there.
**Decode** is the model writing the answer, one token at a time, because it
cannot start the second token until it has seen the first. Everything
expensive in this post happens during decode.

<div class='sketch'>
    <svg viewBox='0 0 720 222' role='img' aria-label='One block of model weights read by every conversation, beside four separate caches of different sizes, one per conversation and usable by nobody else.'>
      <text class='sk-lbl' x='14.0' y='24.0' text-anchor='start'>shared by everyone</text>
      <path class='sk-s3' d='M21.5,35.3 Q97.4,34.4 173.2,35.3 Q181.2,35.3 181.2,43.3 Q181.8,109.9 181.2,176.6 Q181.2,184.6 173.2,184.6 Q97.4,185.0 21.5,184.6 Q13.5,184.6 13.5,176.6 Q12.6,109.9 13.5,43.3 Q13.5,35.3 21.5,35.3'/>
      <path class='sk-s3' d='M21.6,35.8 Q98.1,36.5 174.7,35.8 Q182.7,35.8 182.7,43.8 Q182.4,110.3 182.7,176.8 Q182.7,184.8 174.7,184.8 Q98.1,184.0 21.6,184.8 Q13.6,184.8 13.6,176.8 Q14.5,110.3 13.6,43.8 Q13.6,35.8 21.6,35.8'/>
      <text class='sk-t' x='98.0' y='108.0' text-anchor='middle'>model weights</text>
      <text class='sk-sub' x='98.0' y='123.0' text-anchor='middle'>read once per step</text>
      <text class='sk-lbl' x='212.0' y='24.0' text-anchor='start'>one per conversation, shared with nobody</text>
      <path class='sk-faint' d='M217.9,36.5 Q459.1,37.4 700.3,36.5 Q706.3,36.5 706.3,42.5 Q707.2,50.9 706.3,59.3 Q706.3,65.3 700.3,65.3 Q459.1,64.7 217.9,65.3 Q211.9,65.3 211.9,59.3 Q211.9,50.9 211.9,42.5 Q211.9,36.5 217.9,36.5'/>
      <path class='sk-faint' d='M218.3,36.8 Q459.2,36.9 700.1,36.8 Q706.1,36.8 706.1,42.8 Q705.7,51.3 706.1,59.8 Q706.1,65.8 700.1,65.8 Q459.2,65.9 218.3,65.8 Q212.3,65.8 212.3,59.8 Q212.9,51.3 212.3,42.8 Q212.3,36.8 218.3,36.8'/>
      <rect x='214.0' y='38.0' width='430.0' height='26.0' rx='5' fill='#8C77BC' stroke='none'/>
      <path class='sk-s' d='M218.5,37.4 Q428.6,36.7 638.7,37.4 Q643.7,37.4 643.7,42.4 Q644.0,50.5 643.7,58.5 Q643.7,63.5 638.7,63.5 Q428.6,64.2 218.5,63.5 Q213.5,63.5 213.5,58.5 Q212.7,50.5 213.5,42.4 Q213.5,37.4 218.5,37.4'/>
      <path class='sk-s' d='M219.8,38.3 Q429.8,38.9 639.8,38.3 Q644.8,38.3 644.8,43.3 Q644.1,50.8 644.8,58.2 Q644.8,63.2 639.8,63.2 Q429.8,63.0 219.8,63.2 Q214.8,63.2 214.8,58.2 Q214.6,50.8 214.8,43.3 Q214.8,38.3 219.8,38.3'/>
      <text class='sk-in' x='226.0' y='56.0' text-anchor='start'>conversation 1</text>
      <path class='sk-faint' d='M218.1,74.0 Q458.7,73.9 699.3,74.0 Q705.3,74.0 705.3,80.0 Q705.6,89.3 705.3,98.6 Q705.3,104.6 699.3,104.6 Q458.7,104.8 218.1,104.6 Q212.1,104.6 212.1,98.6 Q211.8,89.3 212.1,80.0 Q212.1,74.0 218.1,74.0'/>
      <path class='sk-faint' d='M217.7,74.9 Q458.9,74.3 700.0,74.9 Q706.0,74.9 706.0,80.9 Q705.4,89.4 706.0,98.0 Q706.0,104.0 700.0,104.0 Q458.9,103.2 217.7,104.0 Q211.7,104.0 211.7,98.0 Q211.3,89.4 211.7,80.9 Q211.7,74.9 217.7,74.9'/>
      <rect x='214.0' y='76.0' width='300.0' height='26.0' rx='5' fill='#8C77BC' stroke='none'/>
      <path class='sk-s' d='M219.1,76.3 Q364.3,75.7 509.6,76.3 Q514.6,76.3 514.6,81.3 Q515.4,89.5 514.6,97.7 Q514.6,102.7 509.6,102.7 Q364.3,103.1 219.1,102.7 Q214.1,102.7 214.1,97.7 Q214.7,89.5 214.1,81.3 Q214.1,76.3 219.1,76.3'/>
      <path class='sk-s' d='M218.5,76.8 Q363.9,76.5 509.3,76.8 Q514.3,76.8 514.3,81.8 Q514.9,89.4 514.3,96.9 Q514.3,101.9 509.3,101.9 Q363.9,101.2 218.5,101.9 Q213.5,101.9 213.5,96.9 Q213.7,89.4 213.5,81.8 Q213.5,76.8 218.5,76.8'/>
      <text class='sk-in' x='226.0' y='94.0' text-anchor='start'>conversation 2</text>
      <path class='sk-faint' d='M218.0,112.8 Q458.8,112.0 699.7,112.8 Q705.7,112.8 705.7,118.8 Q706.3,127.8 705.7,136.8 Q705.7,142.8 699.7,142.8 Q458.8,143.3 218.0,142.8 Q212.0,142.8 212.0,136.8 Q211.9,127.8 212.0,118.8 Q212.0,112.8 218.0,112.8'/>
      <path class='sk-faint' d='M218.9,112.1 Q459.1,112.3 699.3,112.1 Q705.3,112.1 705.3,118.1 Q704.9,126.8 705.3,135.6 Q705.3,141.6 699.3,141.6 Q459.1,142.5 218.9,141.6 Q212.9,141.6 212.9,135.6 Q212.7,126.8 212.9,118.1 Q212.9,112.1 218.9,112.1'/>
      <rect x='214.0' y='114.0' width='496.0' height='26.0' rx='5' fill='#8C77BC' stroke='none'/>
      <path class='sk-s' d='M219.1,113.7 Q462.4,113.0 705.6,113.7 Q710.6,113.7 710.6,118.7 Q711.2,127.0 710.6,135.3 Q710.6,140.3 705.6,140.3 Q462.4,140.0 219.1,140.3 Q214.1,140.3 214.1,135.3 Q213.8,127.0 214.1,118.7 Q214.1,113.7 219.1,113.7'/>
      <path class='sk-s' d='M219.3,114.1 Q462.6,115.0 705.9,114.1 Q710.9,114.1 710.9,119.1 Q710.4,127.1 710.9,135.1 Q710.9,140.1 705.9,140.1 Q462.6,140.5 219.3,140.1 Q214.3,140.1 214.3,135.1 Q214.6,127.1 214.3,119.1 Q214.3,114.1 219.3,114.1'/>
      <text class='sk-in' x='226.0' y='132.0' text-anchor='start'>conversation 3</text>
      <path class='sk-faint' d='M218.0,149.7 Q458.9,149.2 699.8,149.7 Q705.8,149.7 705.8,155.7 Q705.0,164.9 705.8,174.1 Q705.8,180.1 699.8,180.1 Q458.9,179.2 218.0,180.1 Q212.0,180.1 212.0,174.1 Q211.4,164.9 212.0,155.7 Q212.0,149.7 218.0,149.7'/>
      <path class='sk-faint' d='M217.1,150.5 Q458.4,150.9 699.6,150.5 Q705.6,150.5 705.6,156.5 Q705.4,165.4 705.6,174.2 Q705.6,180.2 699.6,180.2 Q458.4,179.6 217.1,180.2 Q211.1,180.2 211.1,174.2 Q210.3,165.4 211.1,156.5 Q211.1,150.5 217.1,150.5'/>
      <rect x='214.0' y='152.0' width='210.0' height='26.0' rx='5' fill='#8C77BC' stroke='none'/>
      <path class='sk-s' d='M219.3,151.6 Q319.4,151.0 419.6,151.6 Q424.6,151.6 424.6,156.6 Q423.7,164.7 424.6,172.8 Q424.6,177.8 419.6,177.8 Q319.4,176.9 219.3,177.8 Q214.3,177.8 214.3,172.8 Q215.2,164.7 214.3,156.6 Q214.3,151.6 219.3,151.6'/>
      <path class='sk-s' d='M218.3,152.6 Q318.4,152.7 418.6,152.6 Q423.6,152.6 423.6,157.6 Q423.9,165.1 423.6,172.6 Q423.6,177.6 418.6,177.6 Q318.4,177.3 218.3,177.6 Q213.3,177.6 213.3,172.6 Q213.5,165.1 213.3,157.6 Q213.3,152.6 218.3,152.6'/>
      <text class='sk-in' x='226.0' y='170.0' text-anchor='start'>conversation 4</text>
      <text class='sk-note' x='360.0' y='208.0' text-anchor='middle'>every one of these is read on every step, too</text>
    </svg>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        The asymmetry this whole post is about. On the left, one set of
        weights, read once per step no matter how many people are being
        served — the more of them there are, the better that bargain looks. On
        the right, one cache per conversation, each a different size because
        each conversation is a different length, and each useful to nobody but
        its owner. Adding a fifth conversation adds a fifth bar, and every bar
        has to be read on every step.
    </div>
</div>

## 1. Four Ways to Fight the Same Number

The story of the last few years is a sequence of attempts to make that number
smaller, or at least cheaper to live with.

<div class='roadmap'>
    <svg viewBox='0 0 760 277' role='img' aria-label='Roadmap of the fight against the cost of the KV cache: multi-query attention in 2019, grouped-query in 2023, paging in 2023, and latent compression in 2024.'>
      <path class='spine' d='M99.4,137.9 Q379.8,138.3 660.2,138.4'/>
      <path class='head' d='M179.8,138.8 Q193.0,138.9 206.3,138.3'/>
      <path class='head' d='M180.5,138.1 Q193.4,139.0 206.2,139.1'/>
      <path class='head' d='M206.0,138.5 Q203.8,140.3 201.3,141.7'/>
      <path class='head' d='M206.0,138.8 Q203.8,136.8 201.2,135.3'/>
      <text class='why' x='193.0' y='114.5'>one shared head was too</text>
      <text class='why' x='193.0' y='127.5'>few</text>
      <path class='head' d='M367.3,138.6 Q379.9,139.3 392.5,139.2'/>
      <path class='head' d='M366.9,139.0 Q380.2,139.1 393.5,139.1'/>
      <path class='head' d='M392.8,138.2 Q390.3,139.5 387.8,141.0'/>
      <path class='head' d='M392.9,138.2 Q390.6,137.0 388.5,135.4'/>
      <text class='why' x='380.0' y='114.5'>a smaller cache, still</text>
      <text class='why' x='380.0' y='127.5'>allocated badly</text>
      <path class='head' d='M554.2,138.4 Q567.4,138.5 580.6,137.9'/>
      <path class='head' d='M554.5,138.7 Q567.0,138.9 579.5,138.0'/>
      <path class='head' d='M580.5,139.1 Q577.7,139.8 575.0,141.1'/>
      <path class='head' d='M580.0,138.8 Q577.5,137.3 575.4,135.3'/>
      <text class='why' x='567.0' y='114.5'>better layout, but the</text>
      <text class='why' x='567.0' y='127.5'>tensor was still large</text>
      <g class='stop'>
        <rect class='hit' x='15.0' y='0.0' width='356.0' height='92.5'/>
        <path class='stem' d='M100.1,92.1 Q99.2,115.2 99.1,138.3'/>
        <circle class='dot' cx='99.5' cy='138.5' r='5'/>
        <path class='box' d='M24.2,-0.3 Q193.2,0.6 362.2,-0.3 Q371.2,-0.3 371.2,8.7 Q372.1,46.4 371.2,84.2 Q371.2,93.2 362.2,93.2 Q193.2,93.2 24.2,93.2 Q15.2,93.2 15.2,84.2 Q14.6,46.4 15.2,8.7 Q15.2,-0.3 24.2,-0.3'/>
        <path class='box' d='M23.7,0.2 Q193.0,0.9 362.3,0.2 Q371.3,0.2 371.3,9.2 Q371.5,46.5 371.3,83.9 Q371.3,92.9 362.3,92.9 Q193.0,92.5 23.7,92.9 Q14.7,92.9 14.7,83.9 Q15.1,46.5 14.7,9.2 Q14.7,0.2 23.7,0.2'/>
        <text class='yr' x='29.0' y='19.0'>2019</text>
        <text class='stage' x='29.0' y='37.0'>share one head</text>
        <circle class='bul' cx='33.0' cy='52.0' r='2'/>
        <text class='body' x='42.0' y='56.0'>every query head gets the same keys and values</text>
        <circle class='bul' cx='33.0' cy='67.5' r='2'/>
        <text class='body' x='42.0' y='71.5'>the cache divides by the head count</text>
        <circle class='bul' cx='33.0' cy='83.0' r='2'/>
        <text class='body' x='42.0' y='87.0'>quality slips</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='15.0' y='184.5' width='356.0' height='92.5'/>
        <path class='stem' d='M285.9,184.0 Q286.5,161.0 287.1,138.0'/>
        <circle class='dot' cx='286.5' cy='138.5' r='5'/>
        <path class='box' d='M24.1,184.2 Q192.7,183.3 361.3,184.2 Q370.3,184.2 370.3,193.2 Q369.6,230.3 370.3,267.4 Q370.3,276.4 361.3,276.4 Q192.7,276.7 24.1,276.4 Q15.1,276.4 15.1,267.4 Q15.9,230.3 15.1,193.2 Q15.1,184.2 24.1,184.2'/>
        <path class='box' d='M23.7,184.3 Q192.8,184.8 361.9,184.3 Q370.9,184.3 370.9,193.3 Q370.2,230.7 370.9,268.2 Q370.9,277.2 361.9,277.2 Q192.8,276.4 23.7,277.2 Q14.7,277.2 14.7,268.2 Q15.2,230.7 14.7,193.3 Q14.7,184.3 23.7,184.3'/>
        <text class='yr' x='29.0' y='203.5'>2023</text>
        <text class='stage' x='29.0' y='221.5'>share a few</text>
        <circle class='bul' cx='33.0' cy='236.5' r='2'/>
        <text class='body' x='42.0' y='240.5'>one key-value head per group of query heads</text>
        <circle class='bul' cx='33.0' cy='252.0' r='2'/>
        <text class='body' x='42.0' y='256.0'>uptrained with 5% of pretraining compute</text>
        <circle class='bul' cx='33.0' cy='267.5' r='2'/>
        <text class='body' x='42.0' y='271.5'>Llama 3 and Mistral ship it</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='0.0' width='356.0' height='92.5'/>
        <path class='stem' d='M473.1,92.0 Q473.4,115.2 474.0,138.4'/>
        <circle class='dot' cx='473.5' cy='138.5' r='5'/>
        <path class='box' d='M397.4,0.2 Q566.4,-0.2 735.3,0.2 Q744.3,0.2 744.3,9.2 Q744.2,46.6 744.3,84.1 Q744.3,93.1 735.3,93.1 Q566.4,92.8 397.4,93.1 Q388.4,93.1 388.4,84.1 Q387.6,46.6 388.4,9.2 Q388.4,0.2 397.4,0.2'/>
        <path class='box' d='M398.6,-0.5 Q567.7,-0.8 736.7,-0.5 Q745.7,-0.5 745.7,8.5 Q745.5,46.3 745.7,84.0 Q745.7,93.0 736.7,93.0 Q567.7,92.7 398.6,93.0 Q389.6,93.0 389.6,84.0 Q388.8,46.3 389.6,8.5 Q389.6,-0.5 398.6,-0.5'/>
        <text class='yr' x='403.0' y='19.0'>2023</text>
        <text class='stage' x='403.0' y='37.0'>stop reserving it</text>
        <circle class='bul' cx='407.0' cy='52.0' r='2'/>
        <text class='body' x='416.0' y='56.0'>hand the cache out in small blocks on demand</text>
        <circle class='bul' cx='407.0' cy='67.5' r='2'/>
        <text class='body' x='416.0' y='71.5'>the way an operating system pages memory</text>
        <circle class='bul' cx='407.0' cy='83.0' r='2'/>
        <text class='body' x='416.0' y='87.0'>nothing gets smaller</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='184.5' width='356.0' height='92.5'/>
        <path class='stem' d='M660.8,185.2 Q661.1,161.6 660.4,137.9'/>
        <circle class='dot' cx='660.5' cy='138.5' r='5'/>
        <path class='box' d='M398.6,185.4 Q567.0,184.6 735.3,185.4 Q744.3,185.4 744.3,194.4 Q743.7,231.2 744.3,268.0 Q744.3,277.0 735.3,277.0 Q567.0,277.3 398.6,277.0 Q389.6,277.0 389.6,268.0 Q389.8,231.2 389.6,194.4 Q389.6,185.4 398.6,185.4'/>
        <path class='box' d='M398.3,184.8 Q567.5,184.6 736.8,184.8 Q745.8,184.8 745.8,193.8 Q745.7,230.9 745.8,268.0 Q745.8,277.0 736.8,277.0 Q567.5,277.8 398.3,277.0 Q389.3,277.0 389.3,268.0 Q389.2,230.9 389.3,193.8 Q389.3,184.8 398.3,184.8'/>
        <text class='yr' x='403.0' y='203.5'>2024</text>
        <text class='stage' x='403.0' y='221.5'>compress it</text>
        <circle class='bul' cx='407.0' cy='236.5' r='2'/>
        <text class='body' x='416.0' y='240.5'>squeeze a token's keys and values into one latent</text>
        <circle class='bul' cx='407.0' cy='252.0' r='2'/>
        <text class='body' x='416.0' y='256.0'>reconstruct them on the way in</text>
      </g>
    </svg>
</div>

I want to point at the third box, because it is the one that surprised me. The
first, second and fourth are all attempts to make the cache *smaller* — fewer
key-value heads, or a compressed stand-in for them. The third makes nothing
smaller at all. It just stops the memory being reserved wastefully, and it
turned out to be worth more than either of the shrinking tricks. I will come
back to it in section 3.

## 2. One Room per Guest, and the Weights Everyone Shares

Let me start with the thing that makes this cost an unusual one.

The **weights** of a model — the numbers it learned during training — are
shared. Every conversation being served runs through the same weights, so a
server handling fifty conversations at once reads them once and lets all fifty
benefit. I would go so far as to say this is why serving models is a business
at all: the expensive asset gets amortised across everybody using it, and the
more people show up, the better the economics look.

The cache is the opposite. Each conversation has its own, it cannot be lent to
anybody else, and it grows for as long as the conversation continues. If the
weights are a building that all the guests share, the cache is a room per
guest, and the rooms get bigger the longer people stay.

<div class='knob'>
    <svg viewBox='0 0 720 250' id='bg-svg' role='img'
         aria-label='The 80 gigabytes of one H100, divided into model weights, the key-value caches of however many conversations fit, and whatever is left over. As the context length grows, fewer conversations fit.'>
        <g id='bg-scene'></g>
    </svg>
    <div class='controls'>
        <label for='bg-m'>model</label>
        <input type='range' id='bg-m' min='0' max='2' value='0' step='1'>
        <span class='readout' id='bg-m-out'></span>
    </div>
    <div class='controls'>
        <label for='bg-l'>tokens in each conversation</label>
        <input type='range' id='bg-l' min='0' max='5' value='2' step='1'>
        <span class='readout' id='bg-l-out'></span>
    </div>
    <p class='note' id='bg-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 2.</span>
    One 80 GB H100, and what it can hold.
    <span style='color:#3E6491'><b>Weights</b></span> are paid for once no
    matter how busy the machine is, and everything left over goes to
    <span style='color:#8C77BC'><b>caches</b></span>, one per conversation. I
    would drag the second slider slowly: the weights never move, and the
    number of people the machine can serve falls off a cliff.
</div>

<script>
(function () {
  var scene = document.getElementById('bg-scene'),
      mR = document.getElementById('bg-m'), lR = document.getElementById('bg-l'),
      mOut = document.getElementById('bg-m-out'), lOut = document.getElementById('bg-l-out'),
      note = document.getElementById('bg-note');
  // layers, kv heads, head dim, parameters. All from the Llama 3 paper.
  var MODELS = [{n: 'Llama 3 8B', L: 32, kv: 8, dh: 128, P: 8.03e9},
                {n: 'Llama 3 70B', L: 80, kv: 8, dh: 128, P: 70.6e9},
                {n: 'Llama 3 405B', L: 126, kv: 8, dh: 128, P: 405.85e9}];
  var LENS = [1024, 4096, 16384, 32768, 65536, 131072];
  var HBM = 80e9, X0 = 24, X1 = 696, Y = 60, H = 52;

  function draw() {
    var m = MODELS[+mR.value], L = LENS[+lR.value];
    var w = m.P * 2;                                  // fp16 weights
    var perSeq = 2 * m.L * m.kv * m.dh * 2 * L;       // bytes of cache per conversation
    var free = HBM - w;
    var fits = Math.max(0, Math.floor(free / perSeq));
    var used = fits * perSeq;
    var s = '';

    if (w >= HBM) {
      s += "<rect x='" + X0 + "' y='" + Y + "' width='" + (X1 - X0) + "' height='" + H +
           "' rx='4' fill='#3E6491' fill-opacity='0.85'/>";
      s += "<text class='wnum' x='" + (X0 + 12) + "' y='" + (Y + 31) + "' fill='#FFFFFF'>" +
           m.n + " does not fit on one card at all (" + (w / 1e9).toFixed(0) + " GB of weights)</text>";
    } else {
      var wx = (X1 - X0) * w / HBM, ux = (X1 - X0) * used / HBM;
      s += "<rect x='" + X0 + "' y='" + Y + "' width='" + wx.toFixed(1) + "' height='" + H +
           "' rx='4' fill='#3E6491' fill-opacity='0.85'/>";
      s += "<rect x='" + (X0 + wx).toFixed(1) + "' y='" + Y + "' width='" + ux.toFixed(1) +
           "' height='" + H + "' rx='0' fill='#8C77BC' fill-opacity='0.85'/>";
      s += "<rect x='" + (X0 + wx + ux).toFixed(1) + "' y='" + Y + "' width='" +
           Math.max(0, (X1 - X0) - wx - ux).toFixed(1) + "' height='" + H +
           "' rx='0' fill='#FFFFFF' stroke='#DEDAD4'/>";
      // one tick per conversation, up to a legible number
      if (fits > 0 && fits <= 64) {
        for (var i = 1; i < fits; i++) {
          var tx = X0 + wx + ux * i / fits;
          s += "<line x1='" + tx.toFixed(1) + "' y1='" + Y + "' x2='" + tx.toFixed(1) +
               "' y2='" + (Y + H) + "' stroke='#FFFFFF' stroke-opacity='0.55'/>";
        }
      }
      s += "<text class='wnum' x='" + (X0 + 10) + "' y='" + (Y + 31) + "' fill='#FFFFFF'>" +
           (w / 1e9).toFixed(0) + " GB</text>";
    }
    s += "<text class='gl' x='" + X0 + "' y='" + (Y - 12) + "'>80 GB of memory on one H100</text>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (Y + H + 26) + "'>weights, paid once</text>";
    s += "<text class='axlabel' x='" + (X0 + 220) + "' y='" + (Y + H + 26) +
         "'>one cache per conversation</text>";
    s += "<text class='axlabel' x='" + (X0 + 470) + "' y='" + (Y + H + 26) + "'>unused</text>";
    s += "<text class='hd' x='" + X0 + "' y='" + (Y + H + 62) + "' font-size='26'>" +
         (w >= HBM ? '0' : fits) + "</text>";
    s += "<text class='axlabel' x='" + (X0 + (w >= HBM ? 22 : String(fits).length * 17 + 8)) +
         "' y='" + (Y + H + 62) + "'>conversations fit at once</text>";
    scene.innerHTML = s;
    mOut.textContent = m.n;
    lOut.textContent = (L / 1024) + 'k tokens each';
    note.textContent = w >= HBM
      ? m.n + ' needs ' + (w / 1e9).toFixed(0) + ' GB just for its weights, so it has to be ' +
        'split across several cards before a single conversation can begin.'
      : 'Each conversation of ' + (L / 1024) + 'k tokens carries ' +
        (perSeq / 1e9).toFixed(2) + ' GB of cache, and ' + (free / 1e9).toFixed(0) +
        ' GB is left after the weights, so ' + fits + ' of them fit. ' +
        (fits < 4 ? 'At that point the machine is serving almost nobody, and the weights are ' +
                    'being read for their benefit alone.'
                  : 'Double the context and that number roughly halves.');
  }
  mR.addEventListener('input', draw);
  lR.addEventListener('input', draw);
  draw();
})();
</script>

To see why this hurts more than it looks, I need to tell you one fact about
the hardware. Models are run on **GPUs** — graphics processors, originally built for
rendering, which happen to be very good at doing the same arithmetic to
thousands of numbers at once. On a GPU, moving a number out of memory and into
the part of the chip that does the arithmetic takes time, and it takes far
more time than the arithmetic itself does. An NVIDIA H100 can perform roughly
three hundred arithmetic operations in the time it takes to fetch a single
byte from its memory. The rate at which it can move bytes is called its
**memory bandwidth**.

This is exactly what Noam Shazeer worked out in 2019. The paper that opens the
roadmap above is remembered for multi-query attention, which is the fix it
proposes, but the part I care about here is the diagnosis that comes first. He
computed the ratio of memory access to arithmetic for one step of decoding,
and got

$$
\Theta\!\left(\frac{n}{d} + \frac{1}{b}\right),
$$

where $n$ is the length of the conversation, $d$ is the width of the model,
and $b$ is the number of conversations being served together. (The estimate
assumes $n \le d$; longer conversations only make the first term worse.)

Now think about what a ratio close to one would mean. The chip would be moving
one byte out of memory for every single arithmetic operation it performs. That
is a terrible trade on this hardware. As I said a moment ago, an H100 can do
about three hundred operations in the time it takes to fetch one byte, so at a
ratio of one it is spending almost all of its time waiting for memory to
arrive and almost none of it computing. The machine is idling, and you are
still paying for it by the hour.

Now I would like you to look at the two terms separately, because they behave
completely differently, and the difference between them is the whole problem
this post is about. The $1/b$ term is the
friendly one: serve more conversations at once and it shrinks, because the
weights get read once and shared among all of them. This is why servers batch
requests together, and it is the single most effective thing anybody does. The
$n/d$ term is not friendly at all. It does not shrink with batching, because
every conversation drags its own cache along. Adding a fifty-first conversation
adds a fifty-first cache that has to be read on every step.

You can feel the trade in the figure below. Move the batch size and watch the
throughput climb as the weights get shared out. Then push the context length
out and watch the cache take over the bar underneath, until the curve stops
rising and the machine simply runs out of memory.

<div class='knob'>
    <svg viewBox='0 0 720 290' id='rl-svg' role='img'
         aria-label='Decoding throughput against batch size for a Llama 3 8B shaped model on one H100, with the bytes moved per step split into weights and KV cache.'>
        <g id='rl-scene'></g>
    </svg>
    <div class='controls'>
        <label for='rl-b'>batch size</label>
        <input type='range' id='rl-b' min='1' max='256' value='16'>
        <span class='readout' id='rl-b-out'></span>
    </div>
    <div class='controls'>
        <label for='rl-l'>context length</label>
        <input type='range' id='rl-l' min='0' max='5' value='3' step='1'>
        <span class='readout' id='rl-l-out'></span>
    </div>
    <div class='controls'>
        <label for='rl-k'>key-value heads (32 query heads)</label>
        <input type='range' id='rl-k' min='0' max='5' value='3' step='1'>
        <span class='readout' id='rl-k-out'></span>
    </div>
    <p class='note' id='rl-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 3.</span>
    A Llama 3 8B-shaped model on one H100. I should say plainly that this
    assumes peak bandwidth and peak arithmetic throughput, so it is an upper
    bound on a machine nobody actually has; a real server lands well below it.
    The bar splits the bytes each step has to move into
    <span style='color:#3E6491'><b>weights</b></span>, read once for the whole
    batch, and <span style='color:#8C77BC'><b>cache</b></span>, read once per
    conversation. Nothing anywhere in this range is limited by arithmetic.
</div>

<script>
(function () {
  var scene = document.getElementById('rl-scene'),
      bR = document.getElementById('rl-b'), lR = document.getElementById('rl-l'),
      kR = document.getElementById('rl-k'), note = document.getElementById('rl-note'),
      bOut = document.getElementById('rl-b-out'), lOut = document.getElementById('rl-l-out'),
      kOut = document.getElementById('rl-k-out');
  var LAYERS = 32, DH = 128, DMODEL = 4096, BYTES = 2;
  // Llama 3 8B is 8.03B parameters at 8 KV heads. Moving the slider changes
  // the width of W_K and W_V, so the model itself changes size: 7.80B at MQA,
  // 8.84B at full MHA. The input embedding, 128256 x 4096, is a lookup rather
  // than a matmul, so it is neither streamed nor counted as arithmetic.
  var EMBED = 128256 * DMODEL;
  var BASE = 8.03e9 - 2 * DMODEL * (8 * DH) * LAYERS - EMBED;
  function params(kv) { return BASE + 2 * DMODEL * (kv * DH) * LAYERS; }
  var BW = 3.35e12, FLOPS = 989e12, HBM = 80e9;
  var LENS = [1024, 2048, 4096, 8192, 16384, 32768], KVH = [1, 2, 4, 8, 16, 32];
  var X0 = 62, X1 = 700, Y0 = 190, YTOP = 24, BMAX = 256;

  function perStep(b, L, kv) {
    var P = params(kv);
    var wBytes = P * BYTES;
    var cBytes = b * L * 2 * LAYERS * kv * DH * BYTES;
    var flops = 2 * P * b + 4 * L * DMODEL * LAYERS * b;
    var tMem = (wBytes + cBytes) / BW, tCmp = flops / FLOPS;
    return { w: wBytes, c: cBytes, tMem: tMem, tCmp: tCmp,
             tps: b / Math.max(tMem, tCmp) };
  }

  function draw() {
    var b = +bR.value, L = LENS[+lR.value], kv = KVH[+kR.value];
    var cur = perStep(b, L, kv), s = '', i;
    var top = 0;
    for (i = 1; i <= BMAX; i++) { top = Math.max(top, perStep(i, L, kv).tps); }
    top = Math.max(top, 1) * 1.12;
    function px(v) { return X0 + (v - 1) / (BMAX - 1) * (X1 - X0); }
    function py(v) { return Y0 - v / top * (Y0 - YTOP); }
    for (i = 0; i <= 4; i++) {
      var g = top * i / 4;
      s += "<line class='grid' x1='" + X0 + "' y1='" + py(g).toFixed(1) + "' x2='" + X1 +
           "' y2='" + py(g).toFixed(1) + "'/><text class='tick' x='" + (X0 - 8) + "' y='" +
           (py(g) + 3).toFixed(1) + "' text-anchor='end'>" + Math.round(g) + "</text>";
    }
    var fitPts = [], ghost = [];
    for (i = 1; i <= BMAX; i++) {
      var st = perStep(i, L, kv), pt = px(i).toFixed(1) + ',' + py(st.tps).toFixed(1);
      if (st.w + st.c + EMBED * BYTES <= HBM) { fitPts.push(pt); } else { ghost.push(pt); }
    }
    if (ghost.length && fitPts.length) { ghost.unshift(fitPts[fitPts.length - 1]); }
    if (ghost.length) {
      s += "<polyline points='" + ghost.join(' ') + "' fill='none' stroke='#8C77BC' " +
           "stroke-width='2.4' stroke-opacity='0.35' stroke-dasharray='5 4'/>";
      s += "<text class='tick' x='" + X1 + "' y='" + (YTOP + 10) +
           "' text-anchor='end'>dashed: will not fit in 80 GB</text>";
    }
    s += "<polyline points='" + fitPts.join(' ') + "' fill='none' stroke='#8C77BC' stroke-width='2.4'/>";
    s += "<circle cx='" + px(b).toFixed(1) + "' cy='" + py(cur.tps).toFixed(1) +
         "' r='5' fill='#A8443E' stroke='#FFFFFF' stroke-width='1.6'/>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (Y0 + 22) + "'>batch size &#8594;</text>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (YTOP - 10) +
         "'>tokens/s, summed over every conversation</text>";
    var tot = cur.w + cur.c, BY = 236, W = X1 - X0;
    s += "<rect x='" + X0 + "' y='" + BY + "' width='" + (W * cur.w / tot).toFixed(1) +
         "' height='26' rx='3' fill='#3E6491' fill-opacity='0.85'/>";
    s += "<rect x='" + (X0 + W * cur.w / tot).toFixed(1) + "' y='" + BY + "' width='" +
         (W * cur.c / tot).toFixed(1) + "' height='26' rx='3' fill='#8C77BC' fill-opacity='0.85'/>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (BY - 7) + "'>bytes moved per decode step: " +
         (tot / 1e9).toFixed(1) + " GB</text>";
    s += "<text class='wnum' x='" + (X0 + 8) + "' y='" + (BY + 17) + "' fill='#FFFFFF'>" +
         (100 * cur.w / tot).toFixed(0) + "%</text>";
    s += "<text class='wnum' x='" + (X1 - 34) + "' y='" + (BY + 17) + "' fill='#FFFFFF'>" +
         (100 * cur.c / tot).toFixed(0) + "%</text>";
    scene.innerHTML = s;
    bOut.textContent = b + ' sequence' + (b === 1 ? '' : 's');
    lOut.textContent = (L / 1024) + 'k tokens';
    kOut.textContent = kv + (kv === 32 ? ' (MHA)' : kv === 1 ? ' (MQA)' : ' (GQA)');
    var fits = (cur.w + cur.c + EMBED * BYTES) <= HBM;
    // The step takes max(tMem, tCmp), not their sum, so quote the ratio of the
    // two and name which one is binding rather than a share of a total that
    // nothing actually pays.
    note.textContent = 'Cache ' + (cur.c / 1e9).toFixed(1) + ' GB against ' +
      (cur.w / 1e9).toFixed(1) + ' GB of weights. Moving those bytes takes ' +
      (cur.tMem / cur.tCmp).toFixed(1) + '\u00d7 longer than the arithmetic, so the ' +
      'step is memory-bound at ' + cur.tps.toFixed(0) + ' tokens/s across the batch ' +
      '\u2014 but ' + (1 / Math.max(cur.tMem, cur.tCmp)).toFixed(0) + ' per sequence, ' +
      'which is what someone waiting for a reply feels. ' + (fits
        ? 'It fits in 80 GB.'
        : 'Weights plus cache need ' + ((cur.w + cur.c) / 1e9).toFixed(0) +
          ' GB and the card has 80 \u2014 the cache runs out of memory before the ' +
          'arithmetic ever becomes the limit.');
  }
  [bR, lR, kR].forEach(function (r) { r.addEventListener('input', draw); });
  draw();
})();
</script>

## 3. The Waste That Had Nothing to Do With Size

The first answers to all of this were attempts to make the cache smaller, by
having several query heads share a single key-value head between them. That is
the story of multi-query and grouped-query attention, boxes one and two of the
roadmap, and it deserves its own post rather than a paragraph in this one.

But there was a second failure that no amount of shrinking would have fixed,
and I think it is the more interesting one, because nothing about it is a
property of the model at all.

The attention **kernels** of the day — a kernel being the small, heavily
optimised program that actually runs one piece of the model on the GPU —
required the cache for a single conversation to sit in one unbroken block of
memory. And nobody knows in advance how long a conversation will run. Put
those two facts together and you get the only safe thing anyone could do:
reserve each conversation enough room for the longest answer it might ever
produce, and hope it uses it.

<div class='knob'>
    <svg viewBox='0 0 720 210' id='pg-svg' role='img'
         aria-label='A strip of GPU memory filled by four requests, either by reserving each request its maximum length contiguously or by handing out small blocks on demand.'>
        <g id='pg-scene'></g>
    </svg>
    <div class='controls'>
        <label for='pg-m'>allocation</label>
        <button type='button' id='pg-m' class='btn'>reserve the maximum</button>
        <span class='readout' id='pg-m-out'></span>
    </div>
    <div class='controls'>
        <label for='pg-r'>maximum length a request may reach</label>
        <input type='range' id='pg-r' min='8' max='28' value='20'>
        <span class='readout' id='pg-r-out'></span>
    </div>
    <p class='note' id='pg-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 4.</span>
    Four conversations growing in one strip of memory. The solid cells are
    holding real keys and values. The pale ones have been reserved for text
    that has not arrived yet, and I would watch how many of them there are,
    because every one is memory that nobody else is allowed to use.
</div>

<script>
(function () {
  var scene = document.getElementById('pg-scene'),
      mB = document.getElementById('pg-m'), mOut = document.getElementById('pg-m-out'),
      rR = document.getElementById('pg-r'), rOut = document.getElementById('pg-r-out'),
      note = document.getElementById('pg-note');
  var reserve = true, BLOCK = 4, SLOTS = 64, LEN = [7, 14, 5, 11], tick = 0;
  var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    var maxLen = +rR.value, s = '', i, r;
    var used = [], alloc = [];
    for (r = 0; r < LEN.length; r++) {
      var grown = Math.min(LEN[r], Math.max(0, tick - r * 3));
      used.push(grown);
      alloc.push(reserve ? maxLen : Math.ceil(grown / BLOCK) * BLOCK);
    }
    var cell = 10.4, X0 = 26, Y0 = 34, at = 0, fit = true;
    var COLS = ['#8C77BC', '#C48BAC', '#6E8C66', '#B07E55'];
    for (r = 0; r < LEN.length; r++) {
      for (i = 0; i < alloc[r]; i++) {
        if (at >= SLOTS) { fit = false; break; }
        var col = at % 32, row = Math.floor(at / 32);
        s += "<rect x='" + (X0 + col * (cell + 1.6)).toFixed(1) + "' y='" +
             (Y0 + row * 30).toFixed(1) + "' width='" + cell.toFixed(1) +
             "' height='20' rx='2' fill='" + COLS[r] + "' fill-opacity='" +
             (i < used[r] ? '0.9' : '0.16') + "' stroke='" + COLS[r] +
             "' stroke-opacity='0.45' stroke-width='0.8'/>";
        at++;
      }
      if (!fit) { break; }
      if (!reserve) { continue; }
    }
    for (i = at; i < SLOTS; i++) {
      var c2 = i % 32, r2 = Math.floor(i / 32);
      s += "<rect x='" + (X0 + c2 * (cell + 1.6)).toFixed(1) + "' y='" + (Y0 + r2 * 30).toFixed(1) +
           "' width='" + cell.toFixed(1) + "' height='20' rx='2' fill='#FFFFFF' stroke='#DEDAD4'/>";
    }
    var U = used.reduce(function (a, b) { return a + b; }, 0);
    var A = Math.min(SLOTS, alloc.reduce(function (a, b) { return a + b; }, 0));
    s += "<text class='gl' x='" + X0 + "' y='24'>64 slots of KV cache memory</text>";
    s += "<text class='axlabel' x='" + X0 + "' y='118'>" + U + " slots hold a token, " +
         A + ' are spoken for &#8212; ' + (100 * U / A).toFixed(0) + '% useful</text>';
    var bw = 620;
    s += "<rect x='" + X0 + "' y='134' width='" + bw + "' height='18' rx='3' fill='#DEDAD4'/>";
    s += "<rect x='" + X0 + "' y='134' width='" + (bw * U / A).toFixed(1) +
         "' height='18' rx='3' fill='#8C77BC'/>";
    if (!fit) {
      s += "<text class='wnum' x='" + X0 + "' y='172' fill='#A8443E'>memory is full: " +
           'a fifth request would have to wait, however little of it is really in use.</text>';
    }
    scene.innerHTML = s;
    mOut.textContent = reserve ? 'contiguous, up to ' + maxLen : 'blocks of ' + BLOCK + ', on demand';
    rOut.textContent = maxLen + ' tokens';
    note.textContent = reserve
      ? 'Every request is given room for ' + maxLen + ' tokens the moment it arrives, ' +
        'because its cache must be contiguous and nobody knows how long it will run. ' +
        'The gap between the two numbers above is memory that exists, is untouched, and ' +
        'cannot be lent to anyone.'
      : 'Each request holds only the blocks it has filled, plus at most ' + (BLOCK - 1) +
        ' spare slots in its last one. The waste no longer depends on how long the ' +
        'request might have run.';
  }
  mB.addEventListener('click', function () {
    reserve = !reserve;
    mB.textContent = reserve ? 'reserve the maximum' : 'hand out blocks';
    draw();
  });
  rR.addEventListener('input', draw);
  if (!reduced) {
    setInterval(function () { tick = (tick + 1) % 24; draw(); }, 700);
  } else { tick = 23; }
  draw();
})();
</script>

The consequence is that most of the memory set aside for caches was holding
nothing at all. The waste has a name, or rather two, and they are worth
knowing because the figure below is labelled with them. **Internal
fragmentation** is the room reserved inside a conversation's own block that it
never grows into. **External fragmentation** is the gaps left between blocks,
each too small for anybody else to move into. In 2023 Kwon and colleagues
measured both on real traffic, and I still find the result startling.

<div class='figure'>
    <img src='/images/kvcache-memory-waste.png'
         alt='Four stacked bars, each the whole KV cache memory of a serving
              system. The first three, all Orca variants, hold only 20.4, 26.8
              and 38.2 percent actual token states, the remainder being
              reservation and internal and external fragmentation. The fourth,
              vLLM, holds 96.3 percent token states.'>
    <div class='caption'>
        <span class='caption-label'>Figure 5.</span>
        Reproduced from Kwon et al. (2023), Figure 2, and recoloured into
        this site's palette. Each bar is the whole of one system's KV cache
        memory, and only the
        <span style='color:#8C77BC'><b>bottom band</b></span> is holding real
        tokens: between 20.4% and 38.2% of it in the systems of the day,
        against 96.3% once the memory is handed out in blocks. I would stress
        that no tensor got any smaller here.
    </div>
</div>

I find this figure quietly remarkable, and it is the reason I wanted to write
this post separately from the other one. The fix was not a better model, a
smaller cache, or a cleverer attention formula. It was to stop insisting that
the cache be contiguous, and hand it out in small blocks as it is needed,
which is exactly what operating systems have done with memory since the
1960s. Nothing got smaller. It was simply put away properly, and the useful
fraction went from about a fifth to almost all of it.

There is a lesson in that which generalises well beyond language models. When
something is expensive, the instinct is to make it smaller. It is worth
checking first whether you are merely storing it badly.

## 4. Where It Stops Being Free

I have one more thing to say, and it is about a line that gets crossed
quietly.

Everything so far leaves the model's answers exactly as they were.
Paging the cache, batching conversations, reading the rows in a different
order — none of these changes a single output. The model says precisely what it
would have said anyway, and that is what has made all of it free in the sense
that matters: you get the speed without giving anything up.

The techniques that come next are not like that, and I think it is worth
knowing where the line is. Throwing away old tokens to make room changes what
the model computes, because the tokens it can no longer see are tokens it can
no longer use. Storing the cache in four bits instead of sixteen changes it
too, in a smaller and subtler way. And sharing key-value heads, which is the
first two boxes of the roadmap, is a third case again: it does not approximate
an existing model, it produces a *different* model, one that had to be trained
or retrained to work that way.

All three may well be worth doing, and all three are in production somewhere
right now. But they are a different kind of bargain from paging, and when
somebody tells you that a serving trick is free, this is the question to ask
about it.

## 5. Chat This Over With Friends

The strange thing about serving a language model is that the expensive part is
not the model. Its weights are shared by everybody on the machine, so the more
conversations you serve at once, the less each one costs, and that is the
entire economics of the business. But every conversation also drags along its
own KV cache, which cannot be shared with anybody, and which grows for as long
as the conversation lasts. So the one move that makes everything else
cheaper — serving more people at once — is the move that makes this particular
cost worse. On a single 80 GB card running an 8B model, long conversations run
out at about three at a time.

The received wisdom is that the answer is to make the cache smaller, and there
is a serious literature on doing exactly that. What I did not expect is that
the biggest win came from somewhere else entirely. When Kwon and colleagues
measured real servers in 2023, only **20% to 38%** of the memory reserved for
caches was holding anything at all, because systems had to reserve room for
the longest answer each conversation might produce. Handing it out in small
blocks instead, the way operating systems have paged memory since the 1960s,
took that to **96%** without making a single tensor smaller. The fair
objection is that this was an unforced error being corrected rather than a
deep insight, and that shrinking still matters once contexts get long. What is
open is whether anything is left that is free: the remaining moves all change
what the model actually says.

## 6. References

1. Shazeer, N. (2019). Fast Transformer Decoding: One Write-Head is All You
   Need. [arXiv:1911.02150](https://arxiv.org/abs/1911.02150)
2. Kwon, W., et al. (2023). Efficient Memory Management for LLM Serving with
   PagedAttention. *SOSP*.
   [arXiv:2309.06180](https://arxiv.org/abs/2309.06180)
3. Ainslie, J., et al. (2023). GQA: Training Generalized Multi-Query
   Transformer Models from Multi-Head Checkpoints. *EMNLP*. [arXiv:2305.13245](https://arxiv.org/abs/2305.13245)
4. Pope, R., et al. (2022). Efficiently Scaling Transformer Inference.
   [arXiv:2211.05102](https://arxiv.org/abs/2211.05102)
5. Grattafiori, A., et al. (2024). The Llama 3 Herd of Models.
   [arXiv:2407.21783](https://arxiv.org/abs/2407.21783)
6. DeepSeek-AI (2024). DeepSeek-V2: A Strong, Economical, and Efficient
   Mixture-of-Experts Language Model. [arXiv:2405.04434](https://arxiv.org/abs/2405.04434)
