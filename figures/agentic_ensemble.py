"""Does generating more causal models actually reduce your uncertainty?

This checks the arithmetic behind the ensemble widget in the agentic-biolab
post. The setup is deliberately crude, because the point it makes survives
almost any refinement:

    An LLM proposes M candidate causal models. Each proposal is the true
    mechanism with probability p (the generator's *coverage*) and a wrong
    mechanism otherwise. Then E falsifying experiments are run. Each wrong
    model is ruled out by each experiment independently with probability q,
    so a wrong model survives all of them with probability s = (1 - q)^E.
    The true model is never ruled out.

Three quantities have closed forms. Writing s for the wrong-model survival
probability:

    truth is somewhere in the ensemble     1 - (1 - p)^M
    truth present and all rivals killed    (1 - (1-p)s)^M - ((1-p)(1-s))^M
    truth absent and a rival survives      (1 - p)^M - ((1-p)(1-s))^M

The middle line is the good outcome: one model left standing and it is the
right one. The last line is the outcome nobody advertises, and it is the one
that grows with M when coverage is zero.

The derivation of the middle line: the number of true copies is Binomial(M, p),
and conditional on k of them, the M - k wrong ones must all die, which happens
with probability (1 - s)^(M-k). Summing the binomial gives
(p + (1-p)(1-s))^M, and subtracting the k = 0 term leaves the expression above.

Run:  python3 figures/agentic_ensemble.py
"""

import random


def closed_form(M, p, q, E):
    s = (1.0 - q) ** E
    present = 1.0 - (1.0 - p) ** M
    none_left = ((1.0 - p) * (1.0 - s)) ** M
    clean = (1.0 - (1.0 - p) * s) ** M - none_left
    wrong = (1.0 - p) ** M - none_left
    return present, clean, wrong


def simulate(M, p, q, E, trials, rng):
    present = clean = wrong = 0
    s = (1.0 - q) ** E
    for _ in range(trials):
        true_copies = 0
        survivors = 0
        for _ in range(M):
            if rng.random() < p:
                true_copies += 1
            elif rng.random() < s:
                survivors += 1
        if true_copies:
            present += 1
            if not survivors:
                clean += 1
        elif survivors:
            wrong += 1
    return present / trials, clean / trials, wrong / trials


if __name__ == '__main__':
    rng = random.Random(20260817)
    TRIALS = 200000
    cases = [(20, 0.03, 0.5, 4),
             (60, 0.03, 0.5, 6),
             (100, 0.03, 0.5, 8),
             (100, 0.00, 0.5, 8),      # the generator cannot propose the truth
             (200, 0.10, 0.7, 5)]

    print('  M      p     q   E |  P(present)     P(clean)     P(wrong)')
    print('  ' + '-' * 68)
    worst = 0.0
    for M, p, q, E in cases:
        exact = closed_form(M, p, q, E)
        sim = simulate(M, p, q, E, TRIALS, rng)
        print('%4d  %5.2f  %4.1f  %2d | %s'
              % (M, p, q, E,
                 '  '.join('%6.4f/%6.4f' % (a, b) for a, b in zip(exact, sim))))
        worst = max(worst, max(abs(a - b) for a, b in zip(exact, sim)))
    print('  ' + '-' * 68)
    print('  largest gap between closed form and %d-trial simulation: %.4f'
          % (TRIALS, worst))
    assert worst < 0.005, 'closed form and simulation disagree'

    print()
    print('  numbers quoted in the post')
    for M in (20, 60, 100):
        print('    p=0.03, M=%3d: truth is in the ensemble %5.1f%% of the time'
              % (M, 100 * (1 - 0.97 ** M)))
    for M in (20, 100):
        _, _, w = closed_form(M, 0.0, 0.5, 8)
        print('    p=0,    M=%3d: confidently wrong %5.1f%% of the time'
              % (M, 100 * w))
    p, q, E = 0.03, 0.5, 8
    best = max(range(1, 401), key=lambda M: closed_form(M, p, q, E)[1])
    print('    p=0.03, q=0.5, E=8: P(clean) peaks at M=%d, at %.1f%%'
          % (best, 100 * closed_form(best, p, q, E)[1]))
    # Past the peak the clean curve falls, and the post claims what it falls
    # *into* is a shortlist rather than an error. These are that claim.
    for M in (best, 200):
        print('    p=0.03, q=0.5, E=8, M=%3d: committed to a wrong model %4.1f%%'
              % (M, 100 * closed_form(M, p, q, E)[2]))
    # And the alarm: with zero coverage, the runs that are not "confidently
    # wrong" are the ones where every single hypothesis dies.
    for M in (20, 100):
        s = (1 - q) ** E
        print('    p=0,    q=0.5, E=8, M=%3d: every hypothesis falsified %4.1f%%'
              % (M, 100 * (1 - s) ** M))
