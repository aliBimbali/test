// snip.countryFlags
// Polyfill für fehlenden Unicode-Flaggen-Support (z.B. Google Chrome)
// Benötigt den TwemojiCountryFlags.woff2-Font (ggf. Link in fontUrl eintragen)
// 
// @returns true if the web font was loaded (ie the browser does not support country flags)
// siehe https://github.com/talkjs/country-flag-emoji-polyfill */

snip.countryFlags = function() {
	
	const fontName 		= "Twemoji Country Flags";
	const fontUrl 		= "/img/mod/core/TwemojiCountryFlags.woff2";
	const fontChecks 	= '"Twemoji Mozilla","Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji","EmojiOne Color","Android Emoji",sans-serif';

	function makeCtx() {
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 1;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		ctx.textBaseline = "top";
		ctx.font = `100px ${fontChecks}`;
		ctx.scale(0.01, 0.01);
		return ctx;
	}

	function getColor(ctx, text, color) {
		ctx.clearRect(0, 0, 100, 100);
		ctx.fillStyle = color;
		ctx.fillText(text, 0, 0);

		const bytes = ctx.getImageData(0, 0, 1, 1).data;
		return bytes.join(",");
	}
	
	function supportsEmoji(text) {
		const ctx = makeCtx();
		const white = getColor(ctx, text, "#fff");
		const black = getColor(ctx, text, "#000");
		return black === white && !black.startsWith("0,0,0,");
	}

	
  if (typeof window !== "undefined" && supportsEmoji("😊") && !supportsEmoji("🇨🇭")) {
    const style = document.createElement("style");
    style.textContent = `@font-face {
      font-family: "${fontName}";
      unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067,
        U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
      src: url('${fontUrl}') format('woff2');
      font-display: swap;
    }`;
    document.head.appendChild(style);
    return true;
  }
  return false;
}
