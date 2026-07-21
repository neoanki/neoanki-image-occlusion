# Image Occlusion

Turn diagrams, maps, anatomy images, and other labeled pictures into recall cards. Draw one or more masks on an image and Image Occlusion creates a separate card for every hidden region.

## Features

- Upload an image while creating a note.
- Draw masks by selecting opposite corners.
- Add and edit masks with keyboard-accessible controls.
- Name each hidden region for a clear answer.
- Add an image description for non-visual review.

## Install

Download the `.neoanki-extension` file from the latest release, then open **Extensions → Browse → Install from file** in Neo Anki. Choose **Image Occlusion** when creating a knowledge item.

## Privacy and permissions

Images stay in your local Neo Anki workspace. Image Occlusion sees only the note and image currently being created or studied, and it cannot connect to the internet.

## Development

Clone this repository beside `neoanki/neo-anki`, then run `npm install`, `npm run typecheck`, `npm test`, `npm run check`, and `npm run build`.
