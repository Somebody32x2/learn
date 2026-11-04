/** Narration for "Atoms & matter waves" (src/lessons/atoms.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'Heat a gas or run a current through it',
          say: `Heat a gas, or run a current through it, and it glows. But not in a rainbow, like a hot solid. Through a prism, you see a few sharp, bright lines. Every element has its own set, a BARCODE, and the same element can absorb the same wavelengths out of white light. Nineteenth-century physicists could measure these lines to five digits, and had no idea why they existed.`,
        },
        {
          at: 'The photon idea from the last chapter says',
          say: `The photon idea from the last chapter says each line is a photon of one exact energy. So the atom itself can only have certain energies, and a line is the atom dropping from one allowed energy to a lower one. The spectrum is a direct read-out of the atom's energy levels.`,
        },
        {
          figure: 'Every element has a barcode',
          style: 'sandbox',
          say: `Here are the visible lines of a few elements. Switch to Absorption: white light through the gas loses exactly the same wavelengths. That works as long as atoms sit in the lower level of each line, as in hot gas, like a star's atmosphere.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'In 1913 Niels Bohr pictured',
          say: `In nineteen thirteen, Niels Bohr pictured hydrogen's electron circling the proton like a planet, but allowed only on certain orbits, labeled by a whole number, n. On an allowed orbit, it doesn't radiate, even though classically it should spiral into the nucleus in a tiny fraction of a nanosecond. Light comes out only when it JUMPS between orbits.`,
        },
        {
          at: 'principal quantum number',
          say: `The allowed energies are minus thirteen point six electron-volts, over n squared, with n equals one, two, three, and so on. They're negative, because the electron is bound, and they climb toward zero as n grows, crowding closer together. N equals one is the ground state, and thirteen point six electron-volts is the energy needed to pull the electron out from there.`,
        },
        {
          at: 'energies of the two levels',
          say: `And each jump makes one photon, carrying exactly the energy difference: h f equals E upper minus E lower. Bigger gaps give higher frequency, and shorter wavelength. Going down emits a photon. Going up requires absorbing a photon of exactly that energy, or a collision.`,
        },
      ],
    },
    {
      voice: 'Achird',
      style: 'figure',
      blocks: [
        {
          figure: 'Hydrogen’s levels make its spectrum',
          step: 0,
          say: `Here are hydrogen's allowed energies. Negative means bound; zero means the electron just barely escapes. The levels crowd together near the top. An electron has been kicked up to n equals three, by a collision in a discharge tube.`,
        },
        {
          figure: 'Hydrogen’s levels make its spectrum',
          step: 1,
          say: `It drops from three to two, and emits ONE photon, carrying the difference: minus one point five one, minus minus three point four, which is one point eight nine electron-volts. That's six hundred fifty-six nanometers: red. Hydrogen's famous red line.`,
        },
        {
          figure: 'Hydrogen’s levels make its spectrum',
          step: 2,
          say: `From n equals four down to two: two point five five electron-volts, four hundred eighty-six nanometers. A bigger drop means a more energetic photon, and a shorter wavelength.`,
        },
        {
          figure: 'Hydrogen’s levels make its spectrum',
          step: 3,
          say: `From five down to two: four hundred thirty-four nanometers.`,
        },
        {
          figure: 'Hydrogen’s levels make its spectrum',
          step: 4,
          say: `From six down to two: four hundred ten nanometers, violet. These visible lines, all ending on n equals two, are the Balmer series.`,
        },
        {
          figure: 'Hydrogen’s levels make its spectrum',
          step: 5,
          say: `Down to the ground state, from two to one, the gap is HUGE: ten point two electron-volts, so the wavelength is a hundred twenty-two nanometers, in the ultraviolet. Drops to n equals one form the Lyman series, in the ultraviolet. Drops to three form the Paschen series, in the infrared.`,
        },
        {
          figure: 'Hydrogen’s levels make its spectrum',
          step: 6,
          say: `Now run it backwards. Shine white light through hydrogen hot enough that many atoms sit in n equals two, like a star's atmosphere. An electron there can absorb only a photon that exactly fits a gap. Those wavelengths go missing, leaving dark lines at the same places. That's how we read the composition of stars.`,
        },
        {
          figure: 'Hydrogen’s levels make its spectrum',
          step: 7,
          say: `Absorb thirteen point six electron-volts or more, and the electron is lifted from n equals one all the way to zero energy. The atom is ionized. From n equals two, it would take only three point four.`,
        },
        {
          at: 'Lines are differences of levels',
          style: 'tutor',
          say: `So remember: a spectral line never tells you a level. It tells you a GAP. Find the two levels, subtract, and convert: the wavelength in nanometers is twelve hundred forty over the energy difference in electron-volts. And emission and absorption between the same two levels give the same wavelength.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          figure: 'Sandbox: make your own lines',
          style: 'sandbox',
          say: `Now make your own lines. Click the level the electron starts on, then the level where it ends. Downward jumps emit, and upward jumps absorb. Can you produce all four visible Balmer lines? And which jumps give infrared?`,
        },
        {
          at: 'Classic mistakes',
          style: 'warn',
          say: `Classic mistakes. Using thirteen point six over n squared for the photon energy, instead of the DIFFERENCE of two levels. Forgetting that the levels are negative, so the upper level is the one closer to zero. And mixing units: twelve hundred forty over lambda gives electron-volts only when lambda is in nanometers.`,
        },
        {
          at: 'Why only certain orbits?',
          say: `So why only certain orbits? In nineteen twenty-four, Louis de Broglie proposed that if light waves can act like particles, then particles can act like waves.`,
        },
        {
          at: 'its momentum (non-relativistic)',
          say: `A particle's wavelength is h over its momentum, h over m v: the same relation as for a photon. More momentum, shorter wavelength. And because h is so small, only very light particles have wavelengths big enough to notice.`,
        },
        {
          at: 'An electron wave going around the nucleus',
          say: `An electron wave going around the nucleus has to join itself smoothly after one lap, or it cancels itself out. So the circumference must hold a whole number of wavelengths. That single condition reproduces Bohr's orbits, and the thirteen point six over n squared energies.`,
        },
        {
          figure: 'Bohr orbits are standing waves',
          style: 'sandbox',
          say: `Drag the slider through values that aren't whole numbers. The wave comes back to the start out of step with itself, so it cancels. Only one, two, three, and so on, survive.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'The idea was confirmed in 1927',
          say: `The idea was confirmed in nineteen twenty-seven, when electrons fired at a nickel crystal came off in a diffraction pattern, just like X-rays. An electron accelerated through a hundred volts has a wavelength of about an eighth of a nanometer, about the spacing of atoms in a crystal. Those short wavelengths are why an electron microscope resolves far finer detail than a light microscope. And a baseball at forty meters per second? Its wavelength is around ten to the minus thirty-four meters, which is why you never see a baseball diffract.`,
        },
        {
          figure: 'Matter wavelengths, same speed, very different sizes',
          style: 'sandbox',
          say: `Here, everything moves at the same speed. The grey bands show the size of a nucleus, an atom, and visible light's wavelength. A wave effect is only visible when the wavelength is comparable to the openings it meets. At equal speeds, the electron's wavelength is twenty-six powers of ten longer than the baseball's.`,
        },
        {
          at: 'Waves bring a built-in limit',
          say: `Waves bring a built-in limit. A wave confined to a small region must mix many wavelengths, so its momentum is spread out. Heisenberg's uncertainty principle makes this precise: delta x times delta p is at least h bar over two. The more precisely you pin down where a particle is, the less precisely its momentum can be defined. That's not a flaw in the instruments; it's what being a wave means. And it explains why the electron doesn't fall into the nucleus: squeezing it closer would raise its momentum spread, and with it, its kinetic energy.`,
        },
        {
          at: 'turned out to be a stepping stone',
          say: `Bohr's neat circular orbits turned out to be a stepping stone. In the full theory, Schrodinger's equation, the electron is a wave spread around the nucleus, and the orbit becomes an ORBITAL: a cloud showing where the electron is likely to be found. But hydrogen's energies come out exactly as Bohr's, which is why his model is still the right tool for spectra in this course.`,
        },
        {
          sel: '.quiz',
          say: `That's atoms and matter waves. Try the checkpoint below, then on to the nucleus.`,
        },
      ],
    },
  ],
};
