/** Narration for "Electromagnetic waves" (src/lessons/em-waves.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Achird',
      blocks: [
        {
          at: ['Everything so far comes down to', 'no magnetic monopoles'],
          say: `Everything so far comes down to four statements about what makes electric and magnetic fields. Together, they're Maxwell's equations, and you've already met all four. Gauss's law: charge makes E. Gauss's law for magnetism: B field lines never start or stop, because there are no magnetic monopoles. Faraday's law: a changing B makes an E. And the Ampere-Maxwell law: currents make B, and so does a CHANGING E.`,
        },
        {
          at: 'Read the last two rows together',
          say: `Read those last two together. A changing B makes an E, and a changing E makes a B. So once you shake a charge, the fields it disturbs can keep regenerating each other, with no charges or wires needed... and the disturbance travels. Maxwell worked out the speed of that travel from two constants you already know: epsilon naught from electrostatics, and mu naught from magnetism.`,
        },
        {
          at: 'speed of every electromagnetic wave in vacuum',
          say: `The speed is one over the square root of mu naught times epsilon naught. Plug in the numbers, and you get about three times ten to the eight meters per second: exactly the measured speed of light. Two constants from experiments with charges and coils predict the speed of light. So light IS an electromagnetic wave.`,
        },
      ],
    },
    {
      voice: 'Charon',
      style: 'figure',
      blocks: [
        {
          at: 'The figure shows how an antenna launches',
          style: 'tutor',
          say: `The next figure shows how an antenna launches such a wave. The arrows are the E field along a line out to the right of the antenna, and the row of marks underneath is B, into or out of the page.`,
        },
        {
          figure: 'An antenna launches a wave',
          step: 0,
          say: `Start with two charges at rest on the ends of a wire: an antenna. Their field is the static E from the first chapters. It points from plus to minus, and fades fast with distance. Nothing moves, and nothing travels.`,
        },
        {
          figure: 'An antenna launches a wave',
          step: 1,
          say: `Now an A C source sloshes the charges up and down. The field next to the antenna flips with them. But each flip doesn't show up everywhere at once: the news spreads outward at a finite speed. Behind the dashed front, there's a ripple of E.`,
        },
        {
          figure: 'An antenna launches a wave',
          step: 2,
          say: `The ripple isn't E alone. A changing E makes B, and a changing B makes E. Each one regenerates the other a little farther along, so the pair carries itself away from the antenna. That self-sustaining pair is an electromagnetic wave.`,
        },
        {
          figure: 'An antenna launches a wave',
          step: 3,
          say: `Far out, E points up and down in the page, and B points into and out of it. They're perpendicular to each other AND to the direction of travel. They peak at the same places, and E equals c times B everywhere. Crest to crest is one wavelength, lambda.`,
        },
        {
          figure: 'An antenna launches a wave',
          step: 4,
          say: `Now wiggle the charges twice as fast. The frequency doubles, so the wavelength HALVES, and the front moves at exactly the same speed. The speed is fixed by the vacuum, so c equals f lambda ties frequency and wavelength together.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'frequency: oscillations per second at a fixed point',
          say: `So, two wave relations. First, c equals f lambda: speed equals frequency times wavelength, true of any wave. In vacuum the speed is fixed, so a higher frequency means a shorter wavelength. Second, E equals c B: the two fields' sizes are locked together, at every point and every instant.`,
        },
        {
          at: 'The picture to keep',
          style: 'tutor',
          say: `Here's the picture to keep. Light is a transverse wave of E and B. E, B, and the direction of travel are all perpendicular to each other. The fields oscillate in phase, E equals c B, and in vacuum, every frequency moves at the same speed, c.`,
        },
        {
          figure: 'A traveling wave in 3D',
          style: 'sandbox',
          say: `Here's a wave in 3D: E in the vertical plane, and B in the horizontal plane. At a two meter wavelength, that's a radio wave at a hundred fifty megahertz. Shorten the wavelength, and watch any one point. It wiggles faster, because the wave still moves at the same speed.`,
        },
        {
          at: 'picks a wavelength, so every',
          say: `Nothing in Maxwell's equations picks a wavelength, so every wavelength is allowed. Radio, microwaves, infrared, visible light, ultraviolet, X-rays, and gamma rays are ONE phenomenon, sorted by wavelength. Your eyes respond to a thin slice, from about four hundred nanometers, violet, to seven hundred, red.`,
        },
        {
          figure: 'The electromagnetic spectrum',
          style: 'sandbox',
          say: `Slide along the spectrum. Each tick is a thousand times longer than the one before, and the whole visible range is that thin colored sliver. Try finding the wavelength that's about the size of you, and see which band it lands in.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'A wave carries',
          say: `A wave carries energy. The power per unit area it delivers is its intensity, and it goes as the SQUARE of the field amplitude: one half, c, epsilon naught, E naught squared. Double the field, and the intensity quadruples. Sunlight at Earth is about a thousand watts per square meter, which works out to a peak field of roughly eight hundred seventy volts per meter.`,
        },
        {
          at: 'A wave also carries',
          say: `A wave also carries momentum, so it pushes on whatever absorbs or reflects it. That radiation pressure is I over c when the light is absorbed, and two I over c when it's reflected, because the light bounces back like a ball. For sunlight, that's only a few micropascals, but it's enough to steer solar sails.`,
        },
        {
          at: 'Because E is transverse, it has a',
          say: `Because E is transverse, it has a direction across the beam, called the polarization. Light from a bulb or the Sun is unpolarized: its E direction jumps around randomly. A polarizer passes only the part of E along its axis. The first one passes HALF the intensity of unpolarized light. After that, the light is polarized, and every later polarizer obeys Malus's law.`,
        },
        {
          at: 'intensity that gets through, now polarized along the axis',
          say: `Malus's law: the intensity through is I naught times cosine squared theta, where theta is the angle between the light's polarization and the polarizer's axis. Squared, because the polarizer passes E cosine theta, and intensity goes as E squared. Aligned, everything passes. Crossed at ninety degrees, nothing does.`,
        },
        {
          figure: 'Polarizers and Malus’s law',
          style: 'sandbox',
          say: `Try it. Unpolarized light hits the first polarizer, which passes half. With the second at thirty degrees, three eighths of the original gets through. Now switch to the crossed pair with one in between. Crossed polarizers alone pass nothing. But slip a third one between them, and light gets through! At forty-five degrees, it's an eighth.`,
        },
        {
          at: 'Classic mistakes',
          style: 'warn',
          say: `Three classic mistakes. Using Malus's law on unpolarized light: the first polarizer always gives exactly half, whatever its angle. Writing cosine theta instead of cosine SQUARED theta: cosine is for the field, cosine squared for the intensity. And measuring theta from the original light, instead of from the PREVIOUS polarizer.`,
        },
        {
          at: 'Polarized sunglasses use this',
          say: `Polarized sunglasses use this. Glare reflected off water and roads is partly polarized horizontally, so lenses with a vertical axis cut it, while passing the rest. And L C D screens put a liquid crystal between crossed polarizers, twisting the light's polarization pixel by pixel.`,
        },
        {
          sel: '.quiz',
          say: `That's electromagnetic waves. Try the checkpoint below, then on to reflection, refraction, and lenses.`,
        },
      ],
    },
  ],
};
