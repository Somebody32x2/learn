/** Narration for "Inductance & oscillations" (src/lessons/inductance.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'A coil carrying current makes a magnetic field through itself',
          say: `A coil carrying current makes a magnetic field through itself. If the current changes, that flux changes, and by Faraday's law the coil induces an emf IN ITSELF. By Lenz's law, that emf opposes the change. Increase the current, and the coil pushes back. Cut the current, and the coil tries to keep it going, which is why a switch on a big motor can spark. This self-opposing coil is an inductor.`,
        },
        {
          at: 'How strongly a coil does this is its',
          say: `How strongly a coil does this is its inductance, L, measured in henries. It depends only on the coil's geometry and what fills it: more turns, more area, and an iron core all increase it. For a long solenoid, L equals mu naught, n squared, A, times its length. The n is squared because more turns make more flux, AND each turn picks up that flux.`,
        },
        {
          at: 'back emf across the inductor',
          say: `The emf across an inductor is minus L, times the rate of change of the current. So it depends on how fast the current is CHANGING, not on the current itself. Steady current: no voltage. Fast change: a large voltage, opposing the change. It's electrical inertia, just like F equals m a resists changes in velocity.`,
        },
        {
          at: 'energy stored in the magnetic field',
          say: `Building up a current against that back emf takes work, and the work is stored in the coil's magnetic field: one half L I squared. Double the current, four times the energy. Compare it with one half m v squared, and with the capacitor's one half C V squared.`,
        },
      ],
    },
    {
      voice: 'Achird',
      style: 'figure',
      blocks: [
        {
          figure: 'The analogy, row by row',
          step: 0,
          say: `Here's a powerful idea. A mass on a spring and an L C circuit obey the SAME equation, just with different letters. Learn the dictionary once, and everything you know about oscillators carries over.`,
        },
        {
          figure: 'The analogy, row by row',
          step: 1,
          say: `Charge on the capacitor plays the role of position. It's the thing that sloshes back and forth.`,
        },
        {
          figure: 'The analogy, row by row',
          step: 2,
          say: `Current is the rate of change of charge, just as velocity is the rate of change of position.`,
        },
        {
          figure: 'The analogy, row by row',
          step: 3,
          say: `Inductance is inertia. A mass resists changes in velocity; an inductor resists changes in current. Neither one cares how fast things are going, only about changing it.`,
        },
        {
          figure: 'The analogy, row by row',
          step: 4,
          say: `The capacitor is the spring. The more charge you pile on, the harder it pushes back, just like F equals k x. And a SMALL capacitance is a STIFF spring, so k corresponds to one over C.`,
        },
        {
          figure: 'The analogy, row by row',
          step: 5,
          say: `Stored energy: the spring's one half k x squared becomes the capacitor's Q squared over two C, energy in the electric field between the plates.`,
        },
        {
          figure: 'The analogy, row by row',
          step: 6,
          say: `Energy of motion: one half m v squared becomes one half L I squared, energy in the magnetic field of the coil.`,
        },
        {
          figure: 'The analogy, row by row',
          step: 7,
          say: `So substitute m becomes L, and k becomes one over C, into omega equals the square root of k over m. You get the L C frequency, omega equals one over the square root of L C. No new physics needed.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'Now the RL circuit',
          say: `Now the R L circuit: a battery, a resistor, and an inductor in series. Close the switch, and the current can't jump straight to the emf over R, the way it would with a resistor alone. The inductor's back emf holds it back. The current climbs smoothly, quickly at first, then more slowly, with time constant tau equals L over R. After one tau it's reached sixty-three percent of its final value; after five, over ninety-nine. It's the same exponential shape as charging a capacitor.`,
        },
        {
          figure: 'Sandbox: current rising in an RL circuit',
          style: 'sandbox',
          say: `Close the switch, and watch the current climb. With half a henry and twenty ohms, tau is twenty-five milliseconds, and the current heads for half an amp. Try a bigger L: it's slower. Then a bigger R: it's faster, but the final current is smaller.`,
        },
        {
          at: 'RL is not RC',
          style: 'warn',
          say: `Careful: R L is not R C. In R C, a bigger resistor makes things SLOWER. In R L, tau is L over R, so a bigger resistor makes things FASTER. And the roles flip at the moment of switching. A capacitor starts out acting like a plain wire, and ends up blocking current. An inductor starts out blocking, with zero current, and ends up acting like a plain wire.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'Now connect a charged capacitor to an inductor',
          say: `Now connect a charged capacitor to an inductor, with no resistor. The capacitor starts to discharge through the coil, but the inductor slows the current's growth. By the time the capacitor is empty, the current is at its peak, and the inductor won't let it stop. It keeps pushing charge onto the other plate, until the capacitor is charged the opposite way. Then it all runs back. The energy SLOSHES between the capacitor's electric field and the inductor's magnetic field, exactly like a mass trading spring energy for kinetic energy.`,
        },
        {
          at: 'angular frequency of the oscillation',
          say: `The frequency: omega equals one over the square root of L C, and f is omega over two pi. A bigger L, more inertia, or a bigger C, a softer spring, means a slower oscillation. And because of the square root, quadrupling either one only halves the frequency.`,
        },
        {
          figure: 'An LC circuit and its mechanical twin',
          style: 'sandbox',
          say: `Here's an L C circuit next to its mechanical twin. With four millihenries and four microfarads, it oscillates at about twelve hundred sixty hertz, slowed way down so you can watch. The middle shows the energy moving between the two fields, and the mass on the right moves in step. Try raising C from four to nine microfarads, and watch the frequency drop to about eight hundred forty hertz.`,
        },
        {
          at: 'Two kinds of field energy, trading places',
          style: 'tutor',
          say: `So, two kinds of field energy, trading places. An L C circuit stores energy alternately in an electric field, charge on the capacitor, and a magnetic field, current in the coil. Charge is at its maximum when the current is zero, and the other way around. And the total stays constant.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          at: 'Two consequences. First,',
          say: `Two consequences. First, tuning. An L C circuit responds strongly only to signals near its own frequency, so turning a radio dial, which changes C, picks one station out of all those in the air. Second, and bigger: the L C circuit trades energy between an electric and a magnetic field. In empty space, a changing E makes B, and a changing B makes E, directly, with no wires... and the pair travels. That's an electromagnetic wave, where the next chapter starts.`,
        },
        {
          sel: '.quiz',
          say: `That's inductance and oscillations, and the end of magnetism. Try the checkpoint below, then on to light.`,
        },
      ],
    },
  ],
};
