/** Narration for "Photons" (src/lessons/photons.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'Around 1900 a few experiments refused',
          say: `By the end of the optics chapters, light is a wave: it interferes, it diffracts, and Maxwell's equations say exactly what's waving. But around nineteen hundred, a few experiments refused to fit that picture. Fixing them needed one new idea: light's energy comes in LUMPS, called photons, each carrying an energy set by its frequency.`,
        },
        {
          at: 'The first crack was',
          say: `The first crack was blackbody radiation: the glow of anything hot, like a stove coil, a filament, or a star. The spectrum has a peak, and the peak moves to shorter wavelengths as the object heats up. That's Wien's law. The Sun, at about fifty-eight hundred kelvin, peaks near five hundred nanometers, right in the middle of the visible band. Wave theory predicted the glow should keep growing without limit at short wavelengths: the "ultraviolet catastrophe". Max Planck got the right curve only by assuming light is emitted and absorbed in chunks, with energy proportional to frequency.`,
        },
        {
          at: 'energy of ONE photon',
          say: `Each photon's energy is E equals h f, or h c over lambda, where h is Planck's constant. Blue photons carry more energy than red ones, and X-ray photons far more. A handy form: the energy in electron-volts is about twelve hundred forty, divided by the wavelength in nanometers. So a six hundred twenty nanometer photon carries two electron-volts.`,
        },
        {
          figure: 'Blackbody spectrum: hotter is bluer and much brighter',
          style: 'sandbox',
          say: `Slide the temperature, and watch the peak move. Hotter is bluer, and much brighter. Switch to "Same scale" to see how fast the brightness grows. And notice a tungsten filament, at about three thousand kelvin, puts most of its output in the infrared.`,
        },
      ],
    },
    {
      voice: 'Charon',
      style: 'figure',
      blocks: [
        {
          at: 'The second crack was the',
          style: 'tutor',
          say: `The second crack was the photoelectric effect. Light shining on a clean metal knocks electrons out of it. You measure how many come out, and how fast the fastest ones are, using a reverse voltage just big enough to stop them: the stopping potential. Wave theory made clear predictions about what brighter or bluer light should do. Let's step through what actually happened.`,
        },
        {
          figure: 'What the wave theory predicted vs what happened',
          step: 0,
          say: `Blue light, at four hundred fifty nanometers, shines on a sodium plate. Electrons come off, and the fastest ones have about half an electron-volt of kinetic energy. So far, both pictures can agree.`,
        },
        {
          figure: 'What the wave theory predicted vs what happened',
          step: 1,
          say: `Double the intensity. Wave theory says a stronger wave shakes each electron harder, so their energy should double. The experiment: TWICE as many electrons, but their maximum energy stays exactly the same.`,
        },
        {
          figure: 'What the wave theory predicted vs what happened',
          step: 2,
          say: `Switch to red light, at seven hundred nanometers, still bright. Wave theory says color shouldn't matter, only intensity. The experiment: no electrons at all.`,
        },
        {
          figure: 'What the wave theory predicted vs what happened',
          step: 3,
          say: `Make the red light twice as bright again. Wave theory: even faster electrons. The experiment: STILL none. It's not a weak effect; it's zero below a threshold, about five hundred forty nanometers for sodium.`,
        },
        {
          figure: 'What the wave theory predicted vs what happened',
          step: 4,
          say: `Now ultraviolet light, at three hundred fifty nanometers, at the original intensity. Wave theory says: same as the first step. The experiment: the maximum energy jumps to about one and a quarter electron-volts. Higher frequency, faster electrons.`,
        },
        {
          figure: 'What the wave theory predicted vs what happened',
          step: 5,
          say: `Very dim blue light. Wave theory says each electron must soak up energy for a while before it can escape, so expect a delay. The experiment: electrons appear INSTANTLY, within nanoseconds. Just fewer of them, still with the same maximum energy.`,
        },
        {
          figure: 'What the wave theory predicted vs what happened',
          step: 6,
          say: `Einstein's fix, in nineteen oh five: light arrives in photons of energy h f, and one photon gives all its energy to one electron. At four hundred fifty nanometers, each photon carries about two point seven six electron-volts. Two point two eight pays to leave the metal, leaving about half an electron-volt. So intensity is HOW MANY photons, and frequency is the energy of EACH.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'kinetic energy of the fastest ejected electrons',
          say: `That's the photoelectric equation: the maximum kinetic energy equals h f, minus phi, the work function, which is the minimum energy to free an electron from that metal. And it equals e times the stopping potential. Below the threshold frequency, phi over h, nothing comes out, however bright the light.`,
        },
        {
          at: 'Intensity counts photons; frequency prices them',
          style: 'tutor',
          say: `So, intensity counts photons, and frequency prices them. Brighter light of the same color means more photons per second, so more electrons, each with the same maximum energy. Higher frequency means more energy per photon, so faster electrons. Brightness never makes up for a photon that's individually too weak.`,
        },
        {
          figure: 'Sandbox: the photoelectric effect',
          style: 'sandbox',
          say: `Each wiggle here is one photon. On the graph, each metal is a line of slope h, starting at its threshold frequency. Try this: find the color where sodium just stops emitting. Then turn the intensity all the way up, and see that it still doesn't.`,
        },
        {
          at: 'Classic mistake',
          style: 'warn',
          say: `A classic mistake: saying more intense light gives faster electrons, or dim light gives slower ones. Intensity only changes HOW MANY electrons. The maximum energy, and the stopping potential, depend only on the frequency and the work function. And watch units: if h f is in electron-volts, the kinetic energy comes out in electron-volts, and the stopping potential in volts is the same number.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: ['Photons also carry', 'momentum of one photon'],
          say: `Photons also carry momentum, even though they have no mass. That's what radiation pressure was, counted photon by photon. The momentum is h over lambda, or E over c. Shorter wavelength, more momentum. For visible light it's tiny, around ten to the minus twenty-seven kilogram meters per second, but X-ray photons carry enough to knock electrons around.`,
        },
        {
          at: 'showed this directly',
          say: `Compton scattering, in nineteen twenty-three, showed this directly. X-rays bouncing off electrons come out with a LONGER wavelength, exactly as if a photon collided with an electron like two billiard balls, and handed it some energy and momentum. The shift is at most about five picometers. That's negligible for visible light, but a few percent for X-rays, which is why it shows up there.`,
        },
        {
          at: 'So which is light, a wave or a stream of particles',
          say: `So which is light: a wave, or a stream of particles? Both descriptions are needed, and each experiment picks one. Interference and diffraction need waves. Emission and absorption happen one photon at a time. The modern statement, wave-particle duality, is that the wave tells you WHERE photons are likely to land, and each one lands as a single lump. Fire photons one at a time through a double slit, and the dots slowly build up the interference pattern. The next chapter turns the idea around: particles like electrons have a wavelength too.`,
        },
        {
          sel: '.quiz',
          say: `That's photons. Try the checkpoint below, then on to atoms and matter waves.`,
        },
      ],
    },
  ],
};
