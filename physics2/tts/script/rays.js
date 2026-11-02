/** Narration for "Reflection, refraction & lenses" (src/lessons/rays.js). Format: see overview.js; guide: tts/WRITING.md (no pause tags). */
export default {
  sections: [
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'you can forget the wave and follow',
          say: `When everything light meets is much bigger than its wavelength, like lenses, mirrors, and windows, you can forget the wave, and follow rays: straight lines along the direction the light travels. This is geometric optics. Interference and diffraction, the next two chapters, are what happens when that approximation fails.`,
        },
        {
          at: 'At a smooth surface some light bounces back',
          say: `At a smooth surface, some light bounces back. The law of reflection says the angle of reflection equals the angle of incidence, both measured from the NORMAL, the line perpendicular to the surface. The rest of the light crosses into the new material, where it travels slower. How much slower is the index of refraction, n equals c over v: one for air, one point three three for water, and about one and a half for glass. And because the light changes speed, it changes direction.`,
        },
        {
          at: 'indices of refraction on the incoming',
          say: `That's Snell's law: n one sine theta one equals n two sine theta two, with both angles measured from the normal. Going into a slower, higher-n material, light bends TOWARD the normal. Going into a faster one, it bends away. The frequency stays the same across the boundary; the speed and the wavelength drop by the factor n.`,
        },
      ],
    },
    {
      voice: 'Charon',
      blocks: [
        {
          figure: 'Sandbox: Snell’s law and total internal reflection',
          style: 'sandbox',
          say: `Try it: drag the yellow handle to change the angle. The ray thickness shows how the light splits between reflected and refracted. Start in glass, going into air, and sweep the angle up past the dotted line at about forty-two degrees. Watch the refracted ray vanish.`,
        },
        {
          at: 'Going from a',
          say: `Here's what happened. Going from a slower medium into a faster one, the refracted ray bends away from the normal. At some incoming angle, it would have to leave at ninety degrees, skimming the surface. That's the critical angle, where sine theta c equals n two over n one. Beyond it there's no refracted ray at all: one hundred percent of the light reflects. This total internal reflection keeps light trapped inside optical fibers for kilometers, and makes diamonds sparkle.`,
        },
        {
          at: 'The index also depends slightly on wavelength',
          say: `The index also depends slightly on wavelength. In glass, violet light has a higher n than red, so it bends more. So a prism fans white light out into its colors. That's dispersion, and it's also why rainbows have red on the outside.`,
        },
        {
          at: 'Snell in one sentence',
          style: 'tutor',
          say: `Snell's law in one sentence. Measure angles from the normal. Into higher n, bend toward the normal. Into lower n, bend away, and past the critical angle, nothing gets out. Total internal reflection needs n one bigger than n two.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: ['Thin lenses and mirrors', 'A lens is shaped so that refraction'],
          say: `Now, thin lenses. A lens is shaped so that refraction at its two curved surfaces sends rays to a common point. A converging lens, thicker in the middle, bends incoming parallel rays so they meet at the focal point, a distance f behind it. A diverging lens, thinner in the middle, spreads parallel rays so they seem to come from a focal point in front of it.`,
        },
        {
          at: 'straight through, undeviated',
          say: `To find an image, trace three easy rays from the tip of the object. A ray coming in parallel to the axis goes out through the far focal point. A ray through the center of the lens goes straight through. And a ray through the near focal point comes out parallel to the axis.`,
        },
        {
          at: 'Where the outgoing rays cross is the image',
          say: `Where the outgoing rays cross is the image. If they really cross, light actually gets there, and you could put a screen at that spot: a REAL image. If they spread apart, extend them backward. They seem to come from a point on the object's side: a VIRTUAL image, which you can see by looking through the lens, but no screen can catch.`,
        },
        {
          at: 'object distance, + for a real object',
          say: `The thin lens equation gives the same answer without drawing: one over f equals one over d o, plus one over d i. And the magnification is minus d i over d o. Watch the signs: f is positive for a converging lens, negative for a diverging one. A negative image distance means a virtual image. And a negative magnification means the image is upside down.`,
        },
        {
          figure: 'Sandbox: ray diagram',
          style: 'sandbox',
          say: `Drag the object along the axis. The focal length is ten centimeters. At twenty-six centimeters, the image forms at about sixteen centimeters, real, inverted, and a bit smaller. Then switch to the diverging lens, and see if you can make anything other than a small, upright, virtual image.`,
        },
      ],
    },
    {
      voice: 'Charon',
      style: 'figure',
      blocks: [
        {
          at: 'Now watch one converging lens as the object walks',
          style: 'tutor',
          say: `Now watch one converging lens as the object walks in toward it. Five positions cover every case an exam can ask about.`,
        },
        {
          figure: 'The object walks toward the lens',
          step: 0,
          say: `The object starts at three f, far beyond two F. The rays meet at one and a half f, between F and two F on the far side: a real, inverted, SMALLER image, half the size. That's a camera, or your eye: a distant scene shrinks onto the sensor or retina.`,
        },
        {
          figure: 'The object walks toward the lens',
          step: 1,
          say: `Object at two f. The image is at two f too, the same distance on the other side: real, inverted, and the same size. The symmetric case.`,
        },
        {
          figure: 'The object walks toward the lens',
          step: 2,
          say: `Object between F and two F. The image moves out to three f and grows: real, inverted, and enlarged, twice the size. A projector works here: small slide, big picture on a far screen.`,
        },
        {
          figure: 'The object walks toward the lens',
          step: 3,
          say: `Object AT the focal point. Every ray leaves the lens parallel to the others, so they never meet. There's no image; it's "at infinity".`,
        },
        {
          figure: 'The object walks toward the lens',
          step: 4,
          say: `Object inside F. Now the rays spread apart after the lens, and never cross. Trace them backward, and they seem to come from a point on the same side as the object: a virtual, upright, enlarged image, two and a half times the size. That's a magnifying glass.`,
        },
        {
          at: 'Sign conventions are where points are lost',
          style: 'warn',
          say: `Sign conventions are where points are lost. Write down the signs before plugging in: f is negative for a diverging lens or a convex mirror, and a negative image distance means a virtual image, not a mistake. A diverging lens ALWAYS gives a virtual, upright, smaller image, wherever the object is. And never drop the minus sign in the magnification. It's what tells you the image is inverted.`,
        },
      ],
    },
    {
      voice: 'Achird',
      blocks: [
        {
          at: 'follow the same equation with',
          say: `Mirrors follow the same equation, with f equal to half the radius of curvature. A concave mirror behaves like a converging lens. A convex mirror, like the passenger-side mirror where "objects are closer than they appear", behaves like a diverging one. The only change is that a mirror's real images form in front of it, on the same side as the object.`,
        },
        {
          at: 'muscles change f to focus',
          say: `You use these every day. Your eye: a converging lens makes a real, inverted image on the retina, and muscles change the focal length to focus. A camera does the same onto a sensor, focusing by moving the lens. And a magnifier puts the object just inside F, for a large, upright, virtual image.`,
        },
        {
          sel: '.quiz',
          say: `That's reflection, refraction, and lenses. Try the checkpoint below, then on to interference.`,
        },
      ],
    },
  ],
};
