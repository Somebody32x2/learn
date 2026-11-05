/** Narration for "Equation sheet in words" (src/lessons/equations.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'Keep this page open during the semester',
          say: `Keep this page open during the semester. Every equation below is listed with what it relates, how the result scales when you change an input, its units, and the chapter that explains it. Read each equation as a sentence. "The force between two charges grows with each charge, and falls with the square of the distance" is more useful on an exam than the symbols alone.`,
        },
        {
          at: 'ratio questions',
          say: `Most of these equations are products and quotients of powers, so most questions about them are RATIO questions: multiply one input by some factor, and ask what happens to the output. The rest are exponentials, like R C circuits, R L circuits, and radioactive decay, where equal time steps multiply the decaying quantity by equal factors.`,
        },
        {
          at: ['The core eight', 'If you know these cold'],
          say: `First, the core eight. If you know these cold, with their words, most of the semester's problems have a starting point.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'Force between two point charges',
          say: `Coulomb's law: F equals k, q one, q two, over r squared. The force between two point charges grows with each charge, and falls with the square of the distance. Like charges repel; unlike charges attract.`,
        },
        {
          at: 'depends only on the charge',
          say: `Gauss's law: the net flux of field out of any CLOSED surface depends only on the charge inside, divided by epsilon naught. With symmetry, it gives you the field in one line.`,
        },
        {
          at: 'Closely spaced equipotentials mean',
          say: `Field and potential: E equals minus the slope of V. The field is the downhill slope of the potential, so closely spaced equipotentials mean a strong field, and E points toward lower V.`,
        },
        {
          at: 'Voltage across a resistor is proportional',
          say: `Ohm and Kirchhoff: V equals I R, the currents in a junction equal the currents out, and the voltage changes around any loop add to zero. Charge is conserved at junctions, and energy around loops. Those three lines solve any D C circuit.`,
        },
        {
          at: 'charges feel it, and the force is',
          say: `The magnetic force: F equals q, v cross B. Only MOVING charges feel it, and the force is perpendicular to both v and B, by the right-hand rule, flipped for negative charges. It changes a particle's direction, never its speed.`,
        },
        {
          at: 'magnetic flux through a loop induces',
          say: `Faraday and Lenz: a CHANGING magnetic flux through a loop induces an emf, proportional to how fast it changes, times the number of turns. And the minus sign means the induced current opposes the change.`,
        },
        {
          at: 'All light travels at c in vacuum',
          say: `Waves: c equals f lambda. All light travels at c in vacuum, so frequency and wavelength are inversely proportional. And the value of c is set by the electric and magnetic constants.`,
        },
        {
          at: 'Light comes in photons whose energy',
          say: `And photon energy: E equals h f, or h c over lambda. Light comes in photons whose energy is proportional to frequency. Blue photons carry more energy than red ones, regardless of brightness.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          figure: 'What happens to the output?',
          style: 'sandbox',
          say: `Now drill the ratio habit with the scaling explorer. Pick an equation, then move the slider to multiply its input. For Coulomb's law, doubling r gives a quarter of the force, because r is squared in the denominator. Try the wire's field, the photon's energy, and decay, and predict each answer before you look.`,
        },
        {
          at: 'Read the exponent, not the formula',
          style: 'tutor',
          say: `The trick: read the exponent, not the formula. If the output goes as the input to the power n, multiplying the input by s multiplies the output by s to the n. Inverse square: double r, quarter the force. Inverse: double r, halve V or B. And if several inputs change at once, multiply their factors.`,
        },
        {
          at: 'All equations by topic',
          say: `Below that, you'll find every equation of the course, grouped by topic, each with what it relates, its units, and a link back to its chapter. Then a table of the constants.`,
        },
        {
          at: 'Unit traps that cost points',
          style: 'warn',
          say: `And the unit traps that cost points. Mind the prefixes: micro is ten to the minus six, nano ten to the minus nine, pico ten to the minus twelve. Square centimeters convert with ten to the minus FOUR, not minus two. And electron-volts are energy, while volts are energy per charge: an electron crossing five volts gains five electron-volts.`,
        },
        {
          sel: '.quiz',
          say: `Try the final checkpoint below. And that's the whole course: from charges and fields, through circuits and magnetism, to light, photons, atoms, and nuclei. Good luck this semester!`,
        },
      ],
    },
  ],
};
