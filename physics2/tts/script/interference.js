/** Narration for "Interference" (src/lessons/interference.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'Rays explain lenses, but not the colors',
          say: `Rays explain lenses, but not the colors of a soap bubble, or the stripes behind two narrow slits. For those, you need the fact that light is a WAVE, and waves obey superposition: where two waves overlap, their fields simply add. Two crests make a bigger crest: that's constructive interference. A crest and a trough cancel: destructive.`,
        },
        {
          at: 'Whether two waves from the same source arrive in step',
          say: `Whether two waves from the same source arrive in step depends on how much farther one of them traveled. That extra distance is the path difference, delta. Every interference problem in this course comes down to computing delta, and comparing it to the wavelength.`,
        },
        {
          at: 'order: 0,',
          say: `Bright where delta equals m lambda, a whole number of wavelengths. Dark where delta equals m plus a half, times lambda. A whole number of wavelengths late is the same as on time. Half a wavelength late puts crest on trough. And only the path DIFFERENCE matters, not the total distance.`,
        },
      ],
    },
    {
      voice: 'Achird',
      style: 'figure',
      blocks: [
        {
          figure: 'Two sources, seen from above',
          style: 'sandbox',
          say: `Here are two sources, seen from above. The yellow circles are wave crests spreading out. The solid dark curves are always constructive, and the dashed ones always cancel. The strip on the right is what a screen would show. Spread the sources apart, or shorten the wavelength: you get more lines, packed closer together.`,
        },
        {
          at: 'In 1801 Thomas Young sent one beam',
          style: 'tutor',
          say: `In eighteen oh one, Thomas Young sent one beam of light through two narrow slits, and saw stripes of light and dark on a far screen. That experiment made the case that light is a wave. One beam through two slits guarantees the two waves start in step, so only the path difference to each point on the screen decides the brightness. Let's follow a point P up the screen.`,
        },
        {
          figure: 'Path difference decides bright or dark',
          step: 0,
          say: `Point P is straight across from the slits. Both paths have the same length, so the waves arrive crest with crest. That's constructive: the bright central fringe.`,
        },
        {
          figure: 'Path difference decides bright or dark',
          step: 1,
          say: `Move P up. Now the path from slit two is longer by half a wavelength. Its wave arrives half a cycle late, crest on trough, and they CANCEL. That's the first dark fringe.`,
        },
        {
          figure: 'Path difference decides bright or dark',
          step: 2,
          say: `Farther up, the path difference is one whole wavelength. One cycle late is the same as on time, so crest meets crest again: the next bright fringe.`,
        },
        {
          figure: 'Path difference decides bright or dark',
          step: 3,
          say: `One and a half wavelengths: out of step again, so dark. Bright and dark simply alternate, as the path difference grows by half wavelengths.`,
        },
        {
          figure: 'Path difference decides bright or dark',
          step: 4,
          say: `Two wavelengths: bright again. In general, bright where the path difference is m lambda, and dark where it's m plus a half, times lambda.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'the two paths are nearly parallel',
          say: `With the screen far away, the two paths are nearly parallel, and the path difference is just d sine theta, where theta is the angle to P. So bright fringes are where d sine theta equals m lambda.`,
        },
        {
          at: 'distance between neighboring bright fringes',
          say: `For small angles, that gives an evenly spaced row of fringes, lambda L over d apart on the screen. A longer wavelength, or a farther screen, spreads them out. Slits farther apart squeeze them together.`,
        },
        {
          figure: 'Sandbox: the double-slit pattern',
          style: 'sandbox',
          say: `Here's the pattern. With green light at five hundred fifty nanometers, slits fifteen hundredths of a millimeter apart, and a screen a meter and a half away, the fringes are five and a half millimeters apart. The first bright fringe is only about a fifth of a degree off center, which is why the screen has to be so far away. Try red light, and watch the fringes spread.`,
        },
        {
          at: 'The one idea',
          style: 'tutor',
          say: `So, the one idea. Compute the path difference, and divide by lambda. A whole number: bright. A half-odd number: dark. For two slits, the path difference is d sine theta, and the fringe spacing, lambda L over d, grows with lambda and L, and shrinks with d.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: ['Thin films', 'Soap bubbles and oil slicks are colored'],
          say: `Soap bubbles and oil slicks are colored for the same reason. Light reflects from the top AND the bottom of a thin film, and the second reflection travels an extra two n t: down and back through thickness t, in a material where the wavelength is shorter by n. There's one more rule. A reflection off a material with HIGHER n flips the wave by half a wavelength, like a rope pulse bouncing off a fixed end. A reflection off a lower n doesn't.`,
        },
        {
          at: 'So count the flips first',
          say: `So count the flips first. With one flip, like a soap film in air, reflection is strongest when two n t equals m plus a half, times lambda. With zero or two flips, like a coating between air and glass, it's strongest when two n t equals m lambda. An anti-reflective coating is a quarter wavelength thick, so the two reflections cancel in the middle of the visible range.`,
        },
        {
          figure: 'Sandbox: thin-film colors',
          style: 'sandbox',
          say: `Try it. A soap film a hundred twenty nanometers thick reflects most strongly at about six hundred forty nanometers, so it looks red. Slide the thickness, and watch the colors cycle. Then switch to the coating on glass, near a hundred nanometers, and watch the reflection nearly vanish across the middle of the spectrum.`,
        },
        {
          at: 'Classic mistakes',
          style: 'warn',
          say: `Classic mistakes. Forgetting the half-wave flips: count them for each reflection. Low to high n flips; high to low doesn't. Using two t instead of two n t, since the wavelength inside the film is lambda over n. And one to watch for next chapter: the double-slit condition gives BRIGHT fringes, while the single-slit formula looks the same but gives DARK ones.`,
        },
        {
          sel: '.quiz',
          say: `That's interference. Try the checkpoint below, then on to diffraction.`,
        },
      ],
    },
  ],
};
