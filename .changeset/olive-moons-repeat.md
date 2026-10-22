---
'@capacitor/assets': major
---

Upgrade sharp from 0.32.6 to ^0.35.5 and raise the Node floor to >=20.9.0.

sharp 0.32 installed its native libvips binary through an `install` script. npm 12
blocks that script by default, leaving sharp on disk but unable to load, so
`npx @capacitor/assets generate` failed at require time. sharp 0.35 has no install
script and resolves platform binaries through optional dependencies instead.

This also clears three high-severity advisories inherited through sharp:
GHSA-f88m-g3jw-g9cj (libvips), GHSA-rgj7-g3m4-5g8c (libheif) and
GHSA-wq5f-xc86-pv6w (librsvg).

Breaking: `engines.node` is now `>=20.9.0`, matching sharp's own floor. Capacitor's
CLI already requires a newer Node than this, so supported setups are unaffected.

Generated assets are unchanged in format, dimensions, channel count and colourspace.
Pixel values differ by at most 2/255 in antialiased edges, from the newer libvips
(8.18.7) and its image encoders. Larger raw differences exist only in the RGB
channels of fully transparent pixels, which are never rendered.
