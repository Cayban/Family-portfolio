# Our Family Wall

A clothesline-style photo gallery. Photos hang like polaroids from a line,
sway gently, and can be viewed full-size or downloaded — one at a time or
all together as a zip.

Your real photos are already loaded in (47 of them). Two versions of each
photo were generated:

- `photos/display/` — a compressed, resized copy used on the wall and in
  the popup viewer, so the page loads fast for your parents.
- `photos/full/` — your original full-quality photo, orientation-corrected,
  used only when someone clicks "download."

You don't need to touch either folder — `photos.js` already points to the
right files.

## Adding more photos later

**Small batch, don't care about compression:** drop new images straight into
`photos/full/` (or anywhere), then add a line to `photos.js`:
```js
{ display: "photos/full/your-file.jpg", full: "photos/full/your-file.jpg", caption: "" },
```
(`display` and `full` can point to the same file — it'll just load a bit
slower than the optimized ones.)

**Bigger batch:** the quickest path is to send me the new photos and I'll
generate compressed display copies the same way I did for this batch.

**Prefer to do it yourself with code:** `generate-manifest.js` is included
as a starting point — it scans a flat `/photos` folder and writes simple
entries (no compression step). You'd need to add an image-resizing step
yourself (e.g. Python + Pillow, or the `sharp` npm package) if you want the
same fast-loading behavior as the current photos.

## Editing captions or order

Open `photos.js` — each line is one photo. Captions are blank by default
since camera filenames aren't very descriptive; add a short caption between
the quotes if you want a handwritten note under a photo. Reorder lines to
change the order photos appear on the wall.

## 2. Preview it locally (optional)

Just open `index.html` in a browser — no build step needed. If photos don't
load due to browser security restrictions on local files, run a quick local
server instead:
```
npx serve .
```
then visit the link it prints.

## 3. Deploy to Vercel

**Easiest way (no command line):**
1. Go to [vercel.com](https://vercel.com) and sign up / log in (free).
2. Click **Add New → Project**.
3. Choose **"Deploy without Git"** / drag-and-drop, and drag this whole
   `family-photobooth` folder onto the page.
4. Vercel deploys it instantly and gives you a link like
   `your-project.vercel.app` — that's what you send your parents.

**If you prefer Git:**
1. Push this folder to a GitHub repo.
2. On vercel.com, click **Add New → Project**, import that repo.
3. No framework/build settings needed — leave everything as "Other" /
   static, and deploy.

Any time you update photos, just re-drag the folder (or `git push`) and
Vercel redeploys automatically.

## Files in this project

- `index.html` — the page structure
- `style.css` — all visual styling
- `script.js` — renders the wall, lightbox, and download logic
- `photos.js` — **the file you edit** to add your real photos
- `generate-manifest.js` — optional helper to auto-fill `photos.js`
- `photos/` — your image files go here
