/** Narration for "Diffraction" (src/lessons/diffraction.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'does not make a sharp-edged beam',
          say: `A wave squeezing through an opening doesn't make a sharp-edged beam. It SPREADS. That spreading is diffraction, and how much it spreads depends on one ratio: the width of the opening, compared to the wavelength. Sound, with wavelengths around a meter, bends around doorways. Light, at half a micrometer, mostly casts sharp shadows, until the opening is only a few micrometers wide.`,
        },
        {
          at: 'The tool for thinking about it is',
          say: `The tool for thinking about it is Huygens' principle. Every point of a wavefront acts as a source of little spherical wavelets, and the next wavefront is their envelope. Through a wide opening, the wavelets add up to a flat front with slightly rounded edges. Through a narrow one, there are only a few wavelets, and the front comes out nearly circular.`,
        },
        {
          figure: 'Huygens’ wavelets through a slit',
          style: 'sandbox',
          say: `Try it here. The wavefronts are bright where the wave is strong, and faint where it's weak, and the dashed lines mark the first dark directions. A slit three wavelengths wide already spreads noticeably. Widen it to eight, and the beam comes out nearly straight. Narrow it to about one, and it spreads into a half circle.`,
        },
      ],
    },
    {
      voice: 'Achird',
      style: 'figure',
      blocks: [
        {
          at: ['The single slit', 'On a far screen, a single slit makes'],
          style: 'tutor',
          say: `On a far screen, a single slit makes a bright central band, with weaker bands on each side. The dark gaps come from wavelets in different parts of the SAME opening, cancelling each other. The next figure shows why. The arrows on the right add the wavelets head to tail, each one turned by its phase.`,
        },
        {
          figure: 'Why a sinθ = λ is dark',
          step: 0,
          say: `Straight ahead, every point of the opening is the same distance from the far screen, so all the wavelets arrive in step. Head to tail, their little arrows make a straight line: the central maximum.`,
        },
        {
          figure: 'Why a sinθ = λ is dark',
          step: 1,
          say: `Tilt, so the two edges differ by half a wavelength. Neighboring wavelets are slightly out of step, so the chain of arrows curls into a half circle, and the sum is shorter: about forty percent of the center.`,
        },
        {
          figure: 'Why a sinθ = λ is dark',
          step: 2,
          say: `Now the edges differ by a whole wavelength. Pair each wavelet in the top half with the one exactly half the opening below it. Every pair differs by half a wavelength, and cancels. The chain closes into a full circle: DARK. That's the first dark fringe.`,
        },
        {
          figure: 'Why a sinθ = λ is dark',
          step: 3,
          say: `At one and a half wavelengths, the chain goes around one and a half times. Two thirds of the opening cancel each other, and one third survives: a weak side maximum, under five percent of the center.`,
        },
        {
          figure: 'Why a sinθ = λ is dark',
          step: 4,
          say: `At two wavelengths, split the opening into quarters. They cancel in pairs, and the chain closes twice: dark again. In general, dark where a sine theta equals m lambda.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'which dark fringe; m = 0 is excluded',
          say: `So for a single slit, a sine theta equals m lambda gives the DARK fringes, where a is the slit width, and m is plus or minus one, two, and so on. The central bright band runs from minus one to plus one, so it's twice as wide as the side bands. And a narrower slit gives a wider pattern: halve a, and every angle roughly doubles.`,
        },
        {
          at: 'The intensity between them follows',
          say: `Between the dark fringes, the intensity is a tall central peak, with side peaks that fall off fast; the first is under five percent of the center. On a screen at distance L, the central band is two lambda L over a wide.`,
        },
        {
          figure: 'Sandbox: single-slit pattern',
          style: 'sandbox',
          say: `With a forty micrometer slit and six hundred nanometer light, the first dark fringe is less than a degree off center, and the central band on a screen a meter away is three centimeters wide. Narrow the slit, and watch the pattern spread.`,
        },
        {
          at: 'The trap: same formula, opposite meaning',
          style: 'warn',
          say: `Here's the trap: the same formula, with opposite meaning. For a single slit, a sine theta equals m lambda, with a the slit WIDTH, gives dark fringes. For a double slit or grating, d sine theta equals m lambda, with d the slit SEPARATION, gives bright fringes. Before using either, ask: is this one opening cancelling itself, or separate openings reinforcing each other?`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: ['Many slits: gratings', 'Add more slits at the same spacing d'],
          say: `Now add more slits, at the same spacing d. The bright fringes stay exactly where d sine theta equals m lambda puts them. But everywhere else, the many waves mostly cancel. So the peaks get SHARPER, and the spaces between them get darker. A diffraction grating has thousands of slits per centimeter, making razor-thin lines at well-separated angles. Each wavelength lands at its own angle, which is how a spectrometer measures wavelengths.`,
        },
        {
          figure: 'Same spacing, more slits',
          style: 'sandbox',
          say: `Compare two, five, and twenty slits. The peaks stay put; only their width changes, shrinking as one over the number of slits.`,
        },
        {
          at: 'Real slits have a width a as well',
          say: `Real slits have a width, as well as a separation, so both effects happen at once. Each slit by itself spreads light into a single-slit pattern, and then the slits' waves interfere. The result is the double-slit fringes, MULTIPLIED by the single-slit envelope. Where an interference maximum falls on a zero of the envelope, it vanishes: a missing order.`,
        },
        {
          figure: 'Sandbox: the envelope',
          style: 'sandbox',
          say: `Here the slits are twenty micrometers wide and sixty apart, so the separation is three times the width. That makes orders three and six land on zeros of the envelope, and disappear. Try changing the ratio, and watch which orders go missing.`,
        },
        {
          at: 'What to remember',
          style: 'tutor',
          say: `What to remember: diffraction spreads a wave by an angle of about lambda over the opening size. One opening: dark fringes at a sine theta equals m lambda. Many openings: bright fringes at d sine theta equals m lambda, sharper the more openings there are. And the envelope from the width multiplies the fringes from the spacing.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'is itself an opening, so even a perfect one',
          say: `Resolution. A lens or a telescope mirror is itself an opening, so even a perfect one turns a point of light into a small blur. Two points can just be told apart when their angular separation is at least the Rayleigh limit: about one point two two lambda over D, for a circular opening of diameter D. Your three millimeter pupil, in green light, gives about two times ten to the minus four radians. Bigger telescopes, and shorter wavelengths, resolve finer detail.`,
        },
        {
          at: 'The atoms of a crystal form a three-dimensional grating',
          say: `And X-ray diffraction. The atoms of a crystal form a three-dimensional grating, with spacings near a tenth of a nanometer, comparable to X-ray wavelengths. The angles of the diffracted beams reveal the atomic spacing. That's how the structure of D N A was found.`,
        },
        {
          sel: '.quiz',
          say: `That's diffraction, and the end of the optics part. Try the checkpoint below, then on to photons.`,
        },
      ],
    },
  ],
};
