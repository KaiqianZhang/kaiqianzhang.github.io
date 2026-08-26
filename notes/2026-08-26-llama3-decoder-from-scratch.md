---
title: 'Coding Roadmap: Llama 3 Decoder from Scratch'
subtitle: The whole implementation as three figures you can read at a glance and then click into — every step, every tensor shape, out in the open.
date: 2026-08-26
tags: foundations
keywords: llama 3, decoder, from scratch, attention, GQA, RoPE, RMSNorm, SwiGLU, residual, next-token prediction, tensor shapes
---

<p class='lede'>Nothing teaches a model like building it with your own hands. So let's roll up our sleeves and write the Llama 3 decoder from scratch — no library hiding the interesting parts, just tensors and their shapes, out in the open. What follows is the roadmap I wish someone had handed me: the whole of <code>Llama3.ipynb</code> as three figures you can read at a glance, and then walk right into.</p>

## Getting ready

Before a single layer runs, four things have to be in place. Download the checkpoint, load it, turn the prompt into a table of vectors, and precompute the two ingredients every layer reuses — the RMSNorm helper and the RoPE angles.

<div class='nfig wide roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 372' role='img' aria-label='A mind-map of the setup: download the model, load it, turn the prompt into embeddings, and precompute RMSNorm and RoPE.'>
<text x='14' y='185.0' class='lbl bg a-pop' style='--d:0.00s;fill:var(--n-plum)'>Get</text>
<text x='14' y='207.0' class='lbl bg a-pop' style='--d:0.08s;fill:var(--n-plum)'>ready</text>
<path d='M142 60.0 C138.7 60.0, 138.7 191.0, 120 191.0 C138.7 191.0, 138.7 322.0, 142 322.0' fill='none' stroke='var(--n-plum)' stroke-width='2.4' stroke-linecap='round' class='a-draw' style='--d:0.22s;--dur:0.9s'/>
<circle cx='152' cy='60.0' r='4' fill='var(--n-student)' class='a-beat' style='--dur:1.9s;--d:0.45s'/>
<text x='166' y='65.0' class='lbl a-rise' style='--d:0.45s;fill:var(--n-student)'>①  Download the model</text>
<path d='M388 36.0 C384.7 36.0, 384.7 60.0, 366 60.0 C384.7 60.0, 384.7 84.0, 388 84.0' fill='none' stroke='var(--n-student)' stroke-width='1.9' stroke-linecap='round' class='a-draw' style='--d:0.80s;--dur:0.8s'/>
<text x='398' y='40.0' class='lbl sm a-rise' style='--d:1.05s'>consolidated.00.pth  —  the weights</text>
<text x='398' y='64.0' class='lbl sm a-rise' style='--d:1.13s'>params.json  —  the hyperparameters</text>
<text x='398' y='88.0' class='lbl sm a-rise' style='--d:1.21s'>tokenizer.model  —  the tokenizer</text>
<circle cx='152' cy='150.0' r='4' fill='var(--n-teal)' class='a-beat' style='--dur:2.2s;--d:0.59s'/>
<text x='166' y='155.0' class='lbl a-rise' style='--d:0.59s;fill:var(--n-teal)'>②  Load it into memory</text>
<path d='M388 126.0 C384.7 126.0, 384.7 150.0, 366 150.0 C384.7 150.0, 384.7 174.0, 388 174.0' fill='none' stroke='var(--n-teal)' stroke-width='1.9' stroke-linecap='round' class='a-draw' style='--d:0.94s;--dur:0.8s'/>
<text x='398' y='130.0' class='lbl sm a-rise' style='--d:1.19s'>weights  —  a dict; print every layer + its shape</text>
<text x='398' y='154.0' class='lbl sm a-rise' style='--d:1.27s'>hyperparameters  —  read the json into variables</text>
<text x='398' y='178.0' class='lbl sm a-rise' style='--d:1.35s'>tokenizer  —  load via transformers (easiest)</text>
<circle cx='152' cy='240.0' r='4' fill='var(--n-violet)' class='a-beat' style='--dur:2.5s;--d:0.73s'/>
<text x='166' y='245.0' class='lbl a-rise' style='--d:0.73s;fill:var(--n-violet)'>③  Prompt → tokens → embeddings</text>
<path d='M388 216.0 C384.7 216.0, 384.7 240.0, 366 240.0 C384.7 240.0, 384.7 264.0, 388 264.0' fill='none' stroke='var(--n-violet)' stroke-width='1.9' stroke-linecap='round' class='a-draw' style='--d:1.08s;--dur:0.8s'/>
<text x='398' y='220.0' class='lbl sm a-rise' style='--d:1.33s'>tokenize  —  bos_token + encode(prompt)</text>
<text x='398' y='244.0' class='lbl sm a-rise' style='--d:1.41s'>embed  —  copy tok_embeddings.weight into an Embedding</text>
<text x='398' y='268.0' class='lbl sm a-rise' style='--d:1.49s'>input_embeddings  →  [seq_len, dim]</text>
<circle cx='152' cy='322.0' r='4' fill='var(--n-ochre)' class='a-beat' style='--dur:2.8s;--d:0.87s'/>
<text x='166' y='327.0' class='lbl a-rise' style='--d:0.87s;fill:var(--n-ochre)'>④  Precompute, once</text>
<path d='M388 310.0 C384.7 310.0, 384.7 322.0, 366 322.0 C384.7 322.0, 384.7 334.0, 388 334.0' fill='none' stroke='var(--n-ochre)' stroke-width='1.9' stroke-linecap='round' class='a-draw' style='--d:1.22s;--dur:0.8s'/>
<text x='398' y='314.0' class='lbl sm a-rise' style='--d:1.47s'>RMSNorm  —  normalise across the embedding dim</text>
<text x='398' y='338.0' class='lbl sm a-rise' style='--d:1.55s'>RoPE frequencies  —  an angle per position (Q, K only)</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 1.</span> Everything before the first layer runs. Four moves: fetch the checkpoint, load it, turn the prompt into a [seq_len, dim] table of vectors, and precompute the two things every layer will reuse.</div>
</div>

## The forward pass, from the outside

Zoom out first, because the model is almost endearingly repetitive. One embedding goes in; **thirty-two identical layers** rewrite it one after another; a final normalisation and a single projection turn it into a score for every token in the vocabulary. That is the entire skeleton — everything interesting lives inside one of those *layer* boxes, which the next figure opens up.

<div class='nfig roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 560 530' role='img' aria-label='The forward pass as a vertical flow: initialise the running embedding, pass it through 32 identical layers, normalise, then project to the vocabulary.'>
<rect x='110.0' y='16.0' width='340' height='58' rx='9' fill='var(--n-grid)' fill-opacity='1' stroke='var(--n-edge)' stroke-width='1.8' class='a-pop' style='--d:0.00s'/>
<text x='280' y='36.0' class='lbl mid a-fade' style='--d:0.08s;fill:var(--n-ink)'>Initialisation</text>
<text x='280' y='55.0' class='lbl sm mid a-fade' style='--d:0.14s;fill:var(--n-dim)'>output_embedding ← input_embedding  [seq_len, dim]</text>
<rect x='110.0' y='98.0' width='340' height='44' rx='9' fill='var(--n-student)' fill-opacity='0.14' stroke='var(--n-student)' stroke-width='1.8' class='a-pop' style='--d:0.12s'/>
<text x='280' y='125.0' class='lbl mid a-fade' style='--d:0.20s;fill:var(--n-ink)'>layer 0</text>
<rect x='110.0' y='166.0' width='340' height='44' rx='9' fill='var(--n-student)' fill-opacity='0.14' stroke='var(--n-student)' stroke-width='1.8' class='a-pop' style='--d:0.24s'/>
<text x='280' y='193.0' class='lbl mid a-fade' style='--d:0.32s;fill:var(--n-ink)'>layer 1</text>
<text x='280' y='256.0' class='lbl bg mid a-fade' style='--d:0.36s;fill:var(--n-dim)'>⋮</text>
<rect x='110.0' y='292.0' width='340' height='44' rx='9' fill='var(--n-student)' fill-opacity='0.14' stroke='var(--n-student)' stroke-width='1.8' class='a-pop' style='--d:0.48s'/>
<text x='280' y='319.0' class='lbl mid a-fade' style='--d:0.56s;fill:var(--n-ink)'>layer 31</text>
<rect x='110.0' y='360.0' width='340' height='58' rx='9' fill='var(--n-grid)' fill-opacity='1' stroke='var(--n-edge)' stroke-width='1.8' class='a-pop' style='--d:0.60s'/>
<text x='280' y='380.0' class='lbl mid a-fade' style='--d:0.68s;fill:var(--n-ink)'>Final RMSNorm</text>
<text x='280' y='399.0' class='lbl sm mid a-fade' style='--d:0.74s;fill:var(--n-dim)'>normalise output_embedding  [seq_len, dim]</text>
<rect x='110.0' y='442.0' width='340' height='58' rx='9' fill='var(--n-grid)' fill-opacity='1' stroke='var(--n-edge)' stroke-width='1.8' class='a-pop' style='--d:0.72s'/>
<text x='280' y='462.0' class='lbl mid a-fade' style='--d:0.80s;fill:var(--n-ink)'>Project to vocabulary</text>
<text x='280' y='481.0' class='lbl sm mid a-fade' style='--d:0.86s;fill:var(--n-dim)'>logits over 128,256 tokens</text>
<path d='M280 77.0 L280 95.0' fill='none' stroke='var(--n-edge)' stroke-width='2' stroke-linecap='round' marker-end='' class='a-draw' style='--d:0.10s;--dur:0.4s'/>
<path d='M280 96.0 l-5 -7 l5 4 l5 -4 z' fill='var(--n-edge)' class='a-fade' style='--d:0.30s'/>
<path d='M280 145.0 L280 163.0' fill='none' stroke='var(--n-edge)' stroke-width='2' stroke-linecap='round' marker-end='' class='a-draw' style='--d:0.22s;--dur:0.4s'/>
<path d='M280 164.0 l-5 -7 l5 4 l5 -4 z' fill='var(--n-edge)' class='a-fade' style='--d:0.42s'/>
<path d='M280 213.0 L280 231.0' fill='none' stroke='var(--n-edge)' stroke-width='2' stroke-linecap='round' marker-end='' class='a-draw' style='--d:0.34s;--dur:0.4s'/>
<path d='M280 232.0 l-5 -7 l5 4 l5 -4 z' fill='var(--n-edge)' class='a-fade' style='--d:0.54s'/>
<path d='M280 271.0 L280 289.0' fill='none' stroke='var(--n-edge)' stroke-width='2' stroke-linecap='round' marker-end='' class='a-draw' style='--d:0.46s;--dur:0.4s'/>
<path d='M280 290.0 l-5 -7 l5 4 l5 -4 z' fill='var(--n-edge)' class='a-fade' style='--d:0.66s'/>
<path d='M280 339.0 L280 357.0' fill='none' stroke='var(--n-edge)' stroke-width='2' stroke-linecap='round' marker-end='' class='a-draw' style='--d:0.58s;--dur:0.4s'/>
<path d='M280 358.0 l-5 -7 l5 4 l5 -4 z' fill='var(--n-edge)' class='a-fade' style='--d:0.78s'/>
<path d='M280 421.0 L280 439.0' fill='none' stroke='var(--n-edge)' stroke-width='2' stroke-linecap='round' marker-end='' class='a-draw' style='--d:0.70s;--dur:0.4s'/>
<path d='M280 440.0 l-5 -7 l5 4 l5 -4 z' fill='var(--n-edge)' class='a-fade' style='--d:0.90s'/>
</svg>
<div class='caption'><span class='caption-label'>Figure 2.</span> The whole model on one screen. The running <em>output_embedding</em> starts as a copy of the input, is rewritten by 32 identical layers, gets one last normalisation, and is projected to a score for every token in the vocabulary. The next figure opens up a single <em>layer</em> box.</div>
</div>

## Inside one layer

Here is the whole model, really — one layer, expanded, and then the short walk to the predicted token. The figure is **live**. Click any box to see *what it produces and the shape it produces it in* (shape is the thing you'll get wrong first), and click **code** for the few lines behind it. The **green** boxes are the one-time setup at the top of each layer; the bracket is the **per-head loop**; everything below it combines the heads and hands the stream to the next layer. Follow it top to bottom and you've read the forward pass end to end.

<div class='decoder-map' role='group' aria-label='Interactive map of one Llama 3 decoder layer and the model exit'>
<div class='dm-head'><span class='dm-title'>Inside layer <em>i</em> — click a box for its output and shape, <span class='dm-code-btn' data-code>code</span> for the code</span><button class='dm-replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button></div>
<div class='dm-input'>input&nbsp;:&nbsp;<strong>output_token_embedding</strong>&nbsp;&nbsp;[seq_len, dim]</div>
<div class='dm-phase'>one-time setup</div>
<div class='dm-step dm-green' style='--i:0'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>head_outputs = []</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>a Python list</span><span class='dm-io-note'>An empty list. By the end of the head loop it holds one result per head.</span></div>
<div class='dm-code'><pre><code>head_outputs = []</code></pre></div>
</div>
<div class='dm-step dm-green' style='--i:1'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>pre-norm  ·  RMSNorm</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, dim]</span><span class='dm-io-note'>RMSNorm before attention. Never changes the shape — it only rescales each row.</span></div>
<div class='dm-code'><pre><code>w = model[f'layers.{i}.attention_norm.weight']<br>pre_norm = rms_norm(output_embedding, w)</code></pre></div>
</div>
<div class='dm-step dm-green' style='--i:2'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>form Wq, split into heads</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[n_heads, head_dim, dim]</span><span class='dm-io-note'>Reshape the query projection so the head axis is explicit.</span></div>
<div class='dm-code'><pre><code>Wq = model[f'layers.{i}.attention.wq.weight']<br>Wq = Wq.view(n_heads, head_dim, dim)</code></pre></div>
</div>
<div class='dm-step dm-green' style='--i:3'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>form Wk, Wv, split into kv-heads</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[n_kv_heads, head_dim, dim]</span><span class='dm-io-note'>Fewer kv-heads than query heads — this is GQA. Several query heads will share one kv-head.</span></div>
<div class='dm-code'><pre><code>Wk = model[...wk.weight].view(n_kv_heads, head_dim, dim)<br>Wv = model[...wv.weight].view(n_kv_heads, head_dim, dim)</code></pre></div>
</div>
<div class='dm-step dm-green' style='--i:4'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>form Wo</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[dim, dim]</span><span class='dm-io-note'>The output projection. No splitting — it is applied once, after the heads are concatenated.</span></div>
<div class='dm-code'><pre><code>Wo = model[f'layers.{i}.attention.wo.weight']</code></pre></div>
</div>
<div class='dm-loop'>
<div class='dm-loop-label'>for each head&nbsp;<em>h</em> &nbsp;in&nbsp; 0 … n_heads−1</div>
<div class='dm-step' style='--i:5'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Compute Q, K, V   (GQA)</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, head_dim] each</span><span class='dm-io-note'>Project the normalised stream. Query head h reads kv-head h // kv_group.</span></div>
<div class='dm-code'><pre><code>q, k, v = Wq[h], Wk[h//kv_group], Wv[h//kv_group]<br>Q, K, V = pre_norm @ q.T, pre_norm @ k.T, pre_norm @ v.T</code></pre></div>
</div>
<div class='dm-step' style='--i:6'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Apply RoPE to Q, K</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, head_dim]</span><span class='dm-io-note'>Rotate each pair of dims by an angle set by position. V is left alone.</span></div>
<div class='dm-code'><pre><code># rotate Q and K by position; leave V untouched<br>Q = view_as_real(view_as_complex(Q) * freqs_cis).view(Q.shape)<br>K = view_as_real(view_as_complex(K) * freqs_cis).view(K.shape)</code></pre></div>
</div>
<div class='dm-step' style='--i:7'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Attention score   S = QKᵀ / √dₖ</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, seq_len]</span><span class='dm-io-note'>Every query against every key, scaled so the softmax stays well-behaved.</span></div>
<div class='dm-code'><pre><code>S = (Q @ K.T) / head_dim**0.5</code></pre></div>
</div>
<div class='dm-step' style='--i:8'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Causal mask   S = S + mask</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, seq_len]</span><span class='dm-io-note'>Add −∞ above the diagonal so a token can never attend to its future.</span></div>
<div class='dm-code'><pre><code>mask = torch.triu(torch.full((n, n), float('-inf')), diagonal=1)<br>S = S + mask</code></pre></div>
</div>
<div class='dm-step' style='--i:9'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Softmax · V</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, head_dim]</span><span class='dm-io-note'>Normalise each row to weights, then take the weighted sum of value vectors.</span></div>
<div class='dm-code'><pre><code>A = softmax(S, dim=1)<br>qkv = A @ V</code></pre></div>
</div>
<div class='dm-step dm-green' style='--i:10'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Append to head_outputs</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, head_dim]</span><span class='dm-io-note'>This head is done. Push its result and go back for the next head.</span></div>
<div class='dm-code'><pre><code>head_outputs.append(qkv)</code></pre></div>
</div>
</div>
<div class='dm-phase'>combine the heads → finish the layer</div>
<div class='dm-step' style='--i:11'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Concat all heads</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, dim]</span><span class='dm-io-note'>Lay the heads side by side. n_heads × head_dim = dim, so the stream width is restored.</span></div>
<div class='dm-code'><pre><code>heads = torch.cat(head_outputs, dim=-1)</code></pre></div>
</div>
<div class='dm-step' style='--i:12'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Output projection   Wo</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, dim]</span><span class='dm-io-note'>Mix the heads back together into one update to the stream.</span></div>
<div class='dm-code'><pre><code>delta = heads @ Wo.T</code></pre></div>
</div>
<div class='dm-step' style='--i:13'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Residual  ·  attention</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, dim]</span><span class='dm-io-note'>Add the attention update onto the stream it came from. This is the residual connection.</span></div>
<div class='dm-code'><pre><code>x = output_embedding + delta</code></pre></div>
</div>
<div class='dm-step' style='--i:14'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>SwiGLU FFN + residual</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, dim]</span><span class='dm-io-note'>ffn_norm → gated feed-forward → add back. w1 and w3 go up, w2 comes back down.</span></div>
<div class='dm-code'><pre><code>h = rms_norm(x, model[f"layers.{i}.ffn_norm.weight"])<br>gate = silu(h @ w1.T) * (h @ w3.T)<br>output_embedding = x + gate @ w2.T</code></pre></div>
</div>
<div class='dm-loopback'>↻ &nbsp;output_embedding feeds the next layer &nbsp;·&nbsp; repeat ×32</div>
<div class='dm-phase'>after all 32 layers — the exit</div>
<div class='dm-step' style='--i:15'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Final RMSNorm</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[seq_len, dim]</span><span class='dm-io-note'>After all 32 layers, one last normalisation of the running stream.</span></div>
<div class='dm-code'><pre><code>output_embedding = rms_norm(output_embedding, model['norm.weight'])</code></pre></div>
</div>
<div class='dm-step' style='--i:16'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Project to vocabulary</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>[128256]</span><span class='dm-io-note'>Take only the last position and score it against every token in the vocabulary.</span></div>
<div class='dm-code'><pre><code>logits = output_embedding[-1] @ model['output.weight'].T</code></pre></div>
</div>
<div class='dm-step' style='--i:17'>
<button class='dm-box' type='button' aria-expanded='false'><span class='dm-name'>Next token = argmax(logits)</span><span class='dm-tags'><span class='dm-hint'>output</span><span class='dm-code-btn' data-code>code</span></span></button>
<div class='dm-io'><span class='dm-io-shape'>a token id → text</span><span class='dm-io-note'>The highest-scoring token is the prediction. Decode it back to text.</span></div>
<div class='dm-code'><pre><code>next_token = torch.argmax(logits)<br>tokenizer.decode([next_token.item()])</code></pre></div>
</div>
<div class='dm-out'>next token&nbsp;→&nbsp;text</div>
</div>

## Now go build it

That really is the entire decoder: a stack of the same layer, then a normalise, a projection, and an *argmax*. If the shapes in the green and teal panels line up in your head, the code will line up on the page. Open <code>Llama3.ipynb</code>, and make each box real — one shape at a time.
