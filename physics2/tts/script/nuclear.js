/** Narration for "Nuclear physics" (src/lessons/nuclear.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'Every atom has a tiny, dense core',
          say: `Every atom has a tiny, dense core: the nucleus, made of protons and neutrons, together called nucleons. Nuclei are measured in femtometers, ten to the minus fifteen meters. Even uranium-238 has a radius of only about seven femtometers, roughly ten thousand times smaller than the atom. Yet nearly all the atom's mass is in there.`,
        },
        {
          at: 'atomic number: number of protons',
          say: `A nucleus is labeled by two numbers. Z, the atomic number, counts the protons, and that defines the element. A, the mass number, counts all the nucleons, so A equals Z plus N, the number of neutrons. Isotopes have the same Z, but a different N, like carbon-12 and carbon-14.`,
        },
        {
          at: 'Packing positive protons a few fm apart',
          say: `Packing positive protons a few femtometers apart takes a huge force: two protons two femtometers apart repel with about sixty newtons. What holds them together is the strong nuclear force, an attraction between ANY two nucleons, stronger than the Coulomb force at short range, but dying off within two or three femtometers. Each nucleon only feels its nearest neighbors, while the electric repulsion reaches across the whole nucleus. That's why heavy nuclei need more neutrons than protons, extra glue with no extra repulsion, and why nothing past bismuth is stable.`,
        },
        {
          at: 'Taking a nucleus apart costs energy',
          say: `Taking a nucleus apart costs energy. So an assembled nucleus has LESS energy, and therefore less mass, than its separate parts. The missing mass is the mass defect, and Einstein's E equals m c squared converts it into the binding energy.`,
        },
        {
          at: 'mass defect (using hydrogen-atom masses',
          say: `Add up the masses of the parts, subtract the mass of the whole, and multiply by c squared. In nuclear units, one atomic mass unit is worth nine hundred thirty-one and a half M e V. Binding energies are millions of electron-volts per nucleon: about a million times the electron-volt scale of chemistry.`,
        },
      ],
    },
    {
      voice: 'Achird',
      style: 'figure',
      blocks: [
        {
          figure: 'The curve of binding energy',
          step: 0,
          say: `This is the curve of binding energy per nucleon: the energy needed to pull a nucleus apart, divided by its number of nucleons. Higher means more tightly bound. The smooth curve is the liquid-drop formula.`,
        },
        {
          figure: 'The curve of binding energy',
          step: 1,
          say: `The dots are measured, from masses. A helium-4 atom is about three hundredths of a mass unit lighter than its parts. That missing mass is twenty-eight point three M e V, or about seven M e V per nucleon. Helium-4 is unusually tightly bound.`,
        },
        {
          figure: 'The curve of binding energy',
          step: 2,
          say: `The curve peaks around iron-56, at eight point eight M e V per nucleon: the most tightly bound region of all nuclei. Light nuclei have too much surface, and heavy ones have too much proton-proton repulsion.`,
        },
        {
          figure: 'The curve of binding energy',
          step: 3,
          say: `Fusion: join light nuclei, and the product sits higher on the curve. The difference comes out as energy. Deuterium plus tritium, making helium-4 and a neutron, releases seventeen point six M e V. That's what powers the Sun, by a slower route from plain hydrogen.`,
        },
        {
          figure: 'The curve of binding energy',
          step: 4,
          say: `Fission: split a heavy nucleus. Uranium-235 sits at about seven point six M e V per nucleon, and its fragments, like barium and krypton, sit near eight point four. One fission releases about a hundred seventy-three M e V.`,
        },
        {
          figure: 'The curve of binding energy',
          step: 5,
          say: `Both processes move nuclei TOWARD the peak, and the energy released equals the gain in total binding energy. Per nucleon, that's three and a half M e V for fusion, and about three quarters of an M e V for fission. Compare a few electron-volts per atom for burning fuel: a million times less.`,
        },
        {
          at: 'Energy comes from climbing the curve',
          style: 'tutor',
          say: `So, energy comes from climbing the curve. Any nuclear reaction that ends higher on it releases energy, equal to the mass that disappears, times c squared. And iron is the bottom of the energy hill: you can't get energy by fusing iron, OR by splitting it.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: ['Most nuclei are', 'Heavy nuclei shed mass'],
          say: `Most nuclei are unstable: eventually they transform on their own, emitting radiation. Alpha decay throws out a helium-4 nucleus, as heavy nuclei shed mass. Beta-minus decay turns a neutron into a proton, emitting an electron, when there are too many neutrons. Beta-plus does the reverse. And gamma decay is just an excited nucleus settling down, emitting a photon. Every decay obeys two bookkeeping rules: charge is conserved, and nucleon number is conserved.`,
        },
        {
          figure: 'A decay chain on the chart of nuclides',
          step: 0,
          style: 'figure',
          say: `On this chart, every nucleus is a square: protons up, neutrons across. Start at uranium-238. Its half-life is four and a half billion years, about the age of the Earth, so roughly half of the Earth's original uranium-238 is still here.`,
        },
        {
          figure: 'A decay chain on the chart of nuclides',
          step: 1,
          style: 'figure',
          say: `Alpha decay, to thorium-234. The nucleus throws out two protons and two neutrons, so Z drops by two, and A by four: two squares down, two left. Thorium-234 lives about twenty-four days.`,
        },
        {
          figure: 'A decay chain on the chart of nuclides',
          step: 2,
          style: 'figure',
          say: `Beta-minus decay, to protactinium. Inside the nucleus, a neutron turns into a proton. Z goes up by one, and A stays the same: one up, one left. Alpha decay left the nucleus neutron-rich, and beta decay fixes the ratio.`,
        },
        {
          figure: 'A decay chain on the chart of nuclides',
          step: 3,
          style: 'figure',
          say: `Another beta-minus, back to uranium. Same element as the start, but a different isotope: uranium-234, which lives about two hundred forty-five thousand years.`,
        },
        {
          figure: 'A decay chain on the chart of nuclides',
          step: 4,
          style: 'figure',
          say: `Then alpha, to thorium-230, and on down the chain. Each step conserves charge and nucleon number, when you count the emitted particle.`,
        },
        {
          figure: 'A decay chain on the chart of nuclides',
          step: 5,
          style: 'figure',
          say: `Alpha, to radium-226, the element Marie Curie isolated. Its half-life is sixteen hundred years.`,
        },
        {
          figure: 'A decay chain on the chart of nuclides',
          step: 6,
          style: 'figure',
          say: `Alpha, to radon-222. Radon is a gas, with a half-life of under four days. It seeps out of the ground into basements, and it's the largest source of natural radiation dose for most people.`,
        },
        {
          figure: 'A decay chain on the chart of nuclides',
          step: 7,
          style: 'figure',
          say: `The chain continues until it reaches lead-206, which is stable. In total: eight alphas, and six beta-minus decays. Check: A drops by eight times four, thirty-two. And Z changes by minus sixteen, plus six: minus ten, from uranium's ninety-two to lead's eighty-two.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'When does a particular nucleus decay?',
          say: `So when does a particular nucleus decay? Nobody can say: decay is RANDOM. Every nucleus of a given kind has the same chance of decaying in the next second, no matter how long it has already existed. With many nuclei, that turns into a smooth exponential law.`,
        },
        {
          at: 'decay constant: probability per unit time',
          say: `N equals N naught, times e to the minus lambda t, or N naught times one half, to the power t over the half-life. Every half-life, half of what's left decays. Lambda, the decay constant, is ln two over the half-life. And the activity, decays per second, is lambda times N, so it falls by the same factor.`,
        },
        {
          figure: 'Sandbox: random decays, predictable curve',
          style: 'sandbox',
          say: `Here are a hundred forty-four identical nuclei, each with the same chance per second to decay. The solid line is this sample, and the dashed line is the formula. Run it a few times: each run uses fresh random numbers, so the sample wanders around the formula, but never exactly on it.`,
        },
        {
          at: 'Classic mistakes',
          style: 'warn',
          say: `Classic mistakes. Treating decay as linear: "after two half-lives, it's all gone". No: after two half-lives, a QUARTER is left, and after three, an eighth. And in alpha decay, A drops by four and Z by two; in beta-minus decay, Z goes UP by one, and A doesn't change. Check every reaction by balancing Z and A on both sides.`,
        },
        {
          at: 'puts the decay law to work',
          say: `Carbon dating puts the decay law to work. Living things keep the same small fraction of carbon-14 as the atmosphere. After death, the carbon-14 decays, with a half-life of fifty-seven hundred thirty years, and isn't replaced. So a bone with a quarter of the living ratio has been through two half-lives: about eleven and a half thousand years. The same idea with uranium-238 dates the oldest rocks.`,
        },
        {
          at: 'One unit check ties the chapter together',
          say: `One unit check ties the chapter together. One atomic mass unit, times c squared, is nine hundred thirty-one and a half M e V. Nuclear energies are millions of electron-volts per nucleus; chemical energies are a few electron-volts per atom. That factor of about a million is the whole difference between a nuclear reactor and a coal furnace.`,
        },
        {
          sel: '.quiz',
          say: `That's nuclear physics, and the last topic of the course. Try the checkpoint below, then finish with the equation sheet.`,
        },
      ],
    },
  ],
};
