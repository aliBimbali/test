// snip.gestures
// Erfasst und triggert Pinch-Events
// @return void

snip.gestures = {
	
	track:function(el){
		var el=snip._(el);
		if(!el) return false;
		
		if(typeof el.snipgestures=='undefined') el.snipgestures={};
		el.snipgestures.prevDiff = -1;
		el.snipgestures.eventCache = [];
		el.onpointerdown 	= function(ev) {this.snipgestures.eventCache.push(ev);};
		el.onpointermove 	= snip.gestures.pointermove_handler;
		el.onpointerup 		= snip.gestures.pointerup_handler;
		el.onpointercancel 	= snip.gestures.pointerup_handler;
		el.onpointerout 	= snip.gestures.pointerup_handler;
		el.onpointerleave 	= snip.gestures.pointerup_handler;
	},

	pointermove_handler: function (ev) {
		
		if (this.snipgestures.eventCache.length == 2) {
			ev.preventDefault();
			ev.stopPropagation();
		}
		
		for (var i = 0; i < this.snipgestures.eventCache.length; i++) {
			if (ev.pointerId == this.snipgestures.eventCache[i].pointerId) {
				this.snipgestures.eventCache[i] = ev;
				break;
			}
		}
		
		if (this.snipgestures.eventCache.length == 2) {
			ev.preventDefault();
			var curDiff = Math.max(
				Math.abs(this.snipgestures.eventCache[0].clientX - this.snipgestures.eventCache[1].clientX),
				Math.abs(this.snipgestures.eventCache[0].clientY - this.snipgestures.eventCache[1].clientY)
			);
			if (this.snipgestures.prevDiff < 0){
				this.snipgestures.initial = curDiff;
				snip.dispatch('pinchstart', this);
			}
			else if(this.snipgestures.prevDiff > 0 && this.snipgestures.prevDiff!=curDiff) {
				snip.dispatch('pinch', this,{
					detail: {
						diff: this.snipgestures.prevDiff-curDiff,
						zoom: this.snipgestures.prevDiff < curDiff ? 'in' : 'out',
						scale:this.snipgestures.prevDiff / this.snipgestures.initial
					}
				});
			}
			this.snipgestures.prevDiff = curDiff;
		}
	},

	pointerup_handler: function(ev) {
		for (var i = 0; i < this.snipgestures.eventCache.length; i++) {
			if (this.snipgestures.eventCache[i].pointerId == ev.pointerId) {
				this.snipgestures.eventCache.splice(i, 1);
				break;
			}
		}

		if (this.snipgestures.eventCache.length < 2) {
			this.snipgestures.prevDiff = -1;
			this.snipgestures.initial = 100;// If the number of pointers down is less than two then reset diff tracker
			snip.dispatch('pinchend', this);
		}
	}
};

// snip.draggable()
// Initiiert oder aktualisiert alle LazyLoad-Instanzen (mit der Klasse 'lazy')
// @return void

snip.draggable = function(elm){
	
	let options = {},
		element = snip._(elm);
	if(!element) return false;
	
	for (var i = 1; i < arguments.length; i++) {
		if(typeof arguments[i]=='object') options = arguments[i];	
	}
	
	let dragHandle = !!options.handle ? snip._(options.handle, element) : element;
	dragHandle.draggable = true;

	dragHandle.on([
		
		["dragstart", function(e){
			element.dataset.dragoldx = e.clientX;
			element.dataset.dragoldy = e.clientY;
			element.dataset.offsetx = element.offsetLeft;
			element.dataset.offsety = element.offsetTop;
			e.dataTransfer.effectAllowed = "move";
		}],
		
		["drag dragend", function(e){

			element.dataset.dragx    = e.clientX;
			element.dataset.dragy    = e.clientY;
			
			var diffw = element.dataset.dragx - parseInt(element.dataset.dragoldx),
				diffh = element.dataset.dragy - parseInt(element.dataset.dragoldy),
				top   = parseInt(element.dataset.offsety)  + diffh,
				mintop= element.offsetHeight / 2,
				maxtop= window.innerHeight + (element.offsetHeight / 2) - 40,
				left  = parseInt(element.dataset.offsetx) + diffw,
				minleft=0,
				maxleft= window.innerWidth - element.offsetWidth;
			element.style.left = Math.min(Math.max(left, minleft),maxleft) + 'px';
			element.style.top  = Math.min(Math.max(top, mintop),maxtop) + 'px';
		}]
		
	]);
};

// snip.sendTrax()
// Sendet Events an einen oder mehrere TrackerTools (derzeit Google Analytics)
// @param string Event-Bezeichner, z.B. 'click', 'viewItem',...
// @param string Event-Kategorie, z.B. 'page', 'teaser',...
// @param string (optional) Event-Label, z.B. modulname, linkbezeichner,...
// @param object (optional) Zusätzliche Optionen, siehe auch https://developers.google.com/analytics/devguides/collection/gtagjs/events
// @return void
// snip.sendTrax('view','teaser','@shop_kategorie~fullteaser',{'value': 3, 'non_interaction': true});

snip.sendTrax = function(event, category, label, options){
	if(typeof options=='undefined') options = {};
	options.event_category = category;
	if(typeof label!='undefined') options.event_label = label;
	if(typeof gtag=='function') gtag('event', event, options);
};

// snip.print()
// Druckt ein Seitenelement aus
// @param string|node DOMNode oder Selektor des Elements, das gedruckt werden soll
// @param string|node Beliebig viele Style-Elemente, die in das Druckdokument übernommen werden. Dies können CSS-Deklarationen, Stylesheet-URLs oder auch Style-Elementknoten sein.
// Beispiel: snip.print('#printSection', 'https://www.uhrzeit.org/style.css', 'body{padding:20mm 10mm !important;}', snip._('#StyleTagId'));   

snip.print = function(element){
	var element = snip._(element);
	if(!element) return false;
	snip._('#printFrame', function(){this.remove();})
	var frame = snip._('<iframe id="printFrame" name="printFrame" frameborder="0" marginheight="0" marginwidth="0" width="0" height="0"></iframe>'),
		style = '<style type="text/css">@page { size: auto; margin: 0mm; } .printOnly{display:block;} .noPrint{display:none;}</style>';
	document.body.append(frame);

	snip.each(arguments, function(index, arg){
		if(index=0) return;
		if(snip.node.test(arg))                style += '<style type="text/css">'+arg.textContent+'</style>';
		else if(snip.string.isValidUrl(arg))   style += '<link type="text/css" rel="stylesheet" href="'+arg+'" />';
		else if(typeof arg=='string')          style += '<style type="text/css">'+arg+'</style>';
	});
	var htm='<html><head>'+style+'</head><body onload="window.print();">'+element.outerHTML+'</body></html>';
	frame.src = 'data:text/html;charset=utf-8,' + encodeURI(htm);
	return;
};

// snip.fitText()
// Verändert die Schriftgröße und ggf. Zeilenhöhe relativ zum Elternelement
// @param string|node DOMNode oder Selektor des Elements, dessen Schriftgröße überwacht werden soll
// @param float Kompressionsstärke, je größer, desto kleiner der Text. Default ist 1
// @param object Optionen, möglich: minFontSize, maxFontSize, lineHeight, lineRelation
// 				lineHeight ist per default 'initial', ansonsten relativ zur Höhe des Elternelements(s.u.) oder der Schriftgröße
// 				lineRelation ist per default 'parent', d.h. Zeilenhöhe bemisst sich an der Höhe des Elternelements
// Beispiel: snip.fitText('#Element span', 0.6 ,{lineHeight:.33});   

snip.fitText = function (el, kompressor, options) {

	var el = snip.__(el),
		settings = snip.object.extend({
			'minFontSize'	: -1/0,
			'maxFontSize'	: 1/0,
			'lineHeight' 	: 'initial',
			'lineRelation'	: 'parent'
		},options);

	if(el.length==0){
		console.error('snip.fitText: Element not found: ',el);
		return;
	}
	var fit = function (el) {
		var compressor = kompressor || 1;
		var resizer = function () {
			var fSize = Math.max(Math.min(el.clientWidth / (compressor*10), parseFloat(settings.maxFontSize)), parseFloat(settings.minFontSize));
			el.style.fontSize = fSize + 'px';
			if(settings.lineHeight!='initial'){
				var lHeight = settings.lineRelation=='parent' ? el.parentNode.clientHeight : fSize;
				el.style.lineHeight = (lHeight*settings.lineHeight) + 'px';
			}
		};
		resizer();
		snip.on('resize orientationchange', window, resizer);
	};
	if (el.length)	for(var i=0; i<el.length; i++) fit(el[i]);
	else 			fit(el);
	return el;
};

// snip.fullscreen
// Stellt die Fullscreen-API-Funktionen zurück und übernimmt die leidige Vendor-Prefix-Kacke
// snip.fullscreen.request(element) Setzt das angegebene Element in den Fullscreen-Mode (element kann ein Query-String oder eine Node sein)
// snip.fullscreen.exit() Beendet den Fullscreen-Mode
// snip.fullscreen.enabled() Gibt zurück, ob die Fullscreen-API verfügbar ist
// snip.fullscreen.element() Gibt das Element zurück, das sich im Fullscreen-Mode befindet, oder null, wenn kein Fullscreen-Mode aktiv ist.
// snip.fullscreen.vendor (string) gibt die API-Kommandos mit dem aktuellen Vendor-Prefix zurück
// snip.fullscreen.on(evt[fullscreenchange|fullscreenerror], callback, options) addEventListener für API-Events setzen
// snip.fullscreen.off(evt[fullscreenchange|fullscreenerror], callback) addEventListener für API-Events entfernen

snip.fullscreen = (function (doc) {
  let 	
  	keys = {fullscreenEnabled: 0,fullscreenElement: 1,requestFullscreen: 2,exitFullscreen: 3,fullscreenchange: 4,fullscreenerror: 5,fullscreen: 6},
	vendors = {
		webkit: ['webkitFullscreenEnabled','webkitFullscreenElement','webkitRequestFullscreen','webkitExitFullscreen','webkitfullscreenchange','webkitfullscreenerror','-webkit-full-screen'],
		moz: ['mozFullScreenEnabled','mozFullScreenElement','mozRequestFullScreen','mozCancelFullScreen','mozfullscreenchange','mozfullscreenerror','-moz-full-screen'],
		ms: ['msFullscreenEnabled','msFullscreenElement','msRequestFullscreen','msExitFullscreen','MSFullscreenChange','MSFullscreenError','-ms-fullscreen']
	},
	vendor = ('fullscreenEnabled' in doc && Object.keys(keys)) || (vendors.webkit[0] in doc && vendors.webkit) || (vendors.moz[0] in doc && vendors.moz) ||  (vendors.ms[0] in doc && vendors.ms) || [],
	element= null;
	
	return {
		vendor:	vendor,
		request:function(elm) {element = snip._(elm); return typeof(element[vendor[keys.requestFullscreen]])=='function' ? element[vendor[keys.requestFullscreen]]() : false;},
		exit: 	function() {if(doc[vendor[keys.fullscreenElement]]==null) return false; let xit = doc[vendor[keys.exitFullscreen]].bind(doc); return xit();},
  		on:  	function(type, handler, options){ return doc.addEventListener(vendor[keys[type]], handler, options); },
  		off: 	function(type, handler, options){ return doc.removeEventListener(vendor[keys[type]], handler, options); },
  		enabled:function() { return Boolean(doc[vendor[keys.fullscreenEnabled]]); },
		element:function() { return doc[vendor[keys.fullscreenElement]]; }
	};
})(typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {});

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


// snipSlider()
// Slider 
// let Slider = new snipSlider('#element');
// <div id="element">
// 	<div>
// 		<span>Item 1</span>
// 		<span>Item 2</span>
// 		<span>Item 3</span>
// 	</div>
// </div>

function snipSlider(element) {

	let options = arguments.length > 1 ? arguments[1] : {};
	this.options = {
		treshold: options.treshold ?? 30, 	// Versatz in Pixeln, bis zu dem der PointerEvent als Klick und nicht als Swipe gewertet wird
		prev: options.prev ?? null,			// Prev-Button Selector/Element
		next: options.next ?? null,			// Next-Button Selector/Element
		slide: options.slide || null,		// das SlideBar-Element innerhalb des Wrappers. Wenn nicht angegeben das erste Kindelement
		auto: options.auto || null,			// Intervall für Autoslider, wenn leer: kein Autoslider
		loop: options.loop || false			// Elemente werden im Loop angezeigt (dafür werden die Elemente dupliziert und die Position jeweils so angepasst, dass das aktive Element nie am Rand der SlideBar liegt)
	};
	this.wrap = snip._(element);
	this.slider =  this.options.slide ? snip._(this.options.slide) : this.wrap.firstElementChild ;
	this.length = 0;
	this.visibleElements = 0;
	this.swipe = {start:null};
	this.auto = null;
	
	this.set = function(){// Slider vorbereiten
	
		this.length = this.slider.children.length;
		
		if(this.length > 0){// Gaps zwischen Elementen berechnen für Positionsbestimmung
			let item = this.slider.firstElementChild ,
				thisEnd = item.offsetLeft + item.getBoundingClientRect().width,
				gap = (item.nextElementSibling.offsetLeft ?? thisEnd) - this.length;
			this.slider.style.minWidth = ((item.offsetWidth + gap) * this.length) + 'px';
			this.visibleElements = Math.floor(this.wrap.offsetWidth / item.offsetWidth);
		}
	}
	
	this.setPos = function(dir){// Slidebar im Wrapper positionieren
		
		this.slider.classList.remove('dragging');
		
		let oldOffset = parseInt(this.slider.dataset.offset ?? 0),
			newOffset  = oldOffset + dir;
		
		newOffset = Math.min(Math.max(0, newOffset), this.length - this.visibleElements);

		if(!!this.slider.children[newOffset]){
			this.slider.dataset.offset = newOffset;
			this.slider.dataset.position = this.slider.children[newOffset].offsetLeft;
			this.slider.style.transform = 'translateX('+((this.slider.dataset.position) * -1)+'px)';
		}
		if(!this.options.loop){
			this.wrap.classList.toggle('start', newOffset <= 0);
			this.wrap.classList.toggle('end', newOffset >= this.length - this.visibleElements);
		}
	}
	
	// Slider initialisieren 
	
	this.wrap.classList.add('snipSliderWrap');
	this.slider.classList.add('snipSliderSlides');
	
	snip.each(this.slider.children, function(){
		this.setAttribute('unselectable', 'on');
		this.classList.add('unselectable');
	});
	
	if(this.options.loop){// Für Loops werden die Elemente dupliziert
		snip.each(this.slider.children, function(){
			let copy = this.cloneNode(true);
			this.parentNode.insertBefore(copy,null);
		});
	}
	this.set();
	this.setPos(0);

	// Slider-Events
	
	let func = this;
	
	if(this.options.loop) snip.on('transitionend', this.slider,function(){// Wenn SlideBar bewegt wurde: prüfen, ggf. Element-Offset anpassen, um Looping zu gewährleisten
		let curOffset = parseInt(func.slider.dataset.offset ?? 0);
		if(curOffset <= 0 || curOffset >= func.length - func.visibleElements){
			curOffset = curOffset <= 0 ? curOffset + (func.length / 2) : curOffset - (func.length / 2);
			func.slider.classList.add('dragging');
			func.slider.style.transform = 'translateX('+((func.slider.children[curOffset].offsetLeft) * -1)+'px)';
			func.slider.dataset.offset = curOffset;
		}
	});
	
	// Mouse/-Touchsteuerung

	snip.on('touchstart mousedown', this.wrap, function(e){
		if(this.classList.contains('start') && this.classList.contains('end')) return;
		if(e.target.closest('.snipSliderPrev') || e.target.closest('.snipSliderNext')) return;
		func.swipe.start = e.type=='touchstart' ? e.changedTouches[0].pageX : e.pageX;
		func.slider.classList.add('dragging');
		e.preventDefault();
	});

	snip.on('touchmove mousemove', this.wrap, function(e){
		if(!func.swipe.start) return;
		let dragged = func.swipe.start - (e.type=='touchmove' ? e.changedTouches[0].pageX : e.pageX),
			offset = parseFloat(func.slider.dataset.position) + dragged;
		if(Math.abs(dragged) > func.options.treshold) func.slider.classList.add('dragged');
		if(offset < func.slider.children[0].offsetLeft) offset += func.slider.children[(func.length / 2)].offsetLeft;
		if(offset > func.slider.children[func.length - func.visibleElements - 1].offsetLeft) offset -= func.slider.children[(func.length / 2)].offsetLeft;
		func.slider.style.transform = 'translateX('+(offset*-1)+'px)';
	});

	snip.on('touchend touchcancel mouseup mouseleave', this.wrap, function(e){
		func.slider.classList.remove('dragging');
		let dragged = func.swipe.start -(['touchend','touchcancel'].includes(e.type) ? e.changedTouches[0].pageX : e.pageX),
			offset = parseFloat(func.slider.dataset.position) + dragged,
			oldItem = parseInt(func.slider.dataset.offset);
		func.swipe.start = null;
		
		if(offset < func.slider.children[0].offsetLeft) offset += func.slider.children[(func.length / 2)].offsetLeft;
		if(offset > func.slider.children[func.length - func.visibleElements - 1].offsetLeft) offset -= func.slider.children[(func.length / 2)].offsetLeft;
		
		if(func.slider.classList.contains('dragged')){
			func.slider.classList.remove('dragged');
		}
		else{
			e.target.click();
			return true;
		}
		
		e.preventDefault();
		snip.each(func.slider.children, function(index, item){
			if(item.offsetLeft + (item.offsetWidth / 2) > offset){
				func.setPos(parseInt(index) - oldItem);
				return false;
			}
		});
	});
	
	// Buttonsteuerung
	
	if(!!this.options.prev){
		snip._(this.options.prev, function(){this.classList.add('snipSliderPrev');});
		snip.on('click', this.options.prev, function(){
			if(this.classList.contains('disabled')) return false;
			func.setPos(-1);
		});
	}
	if(!!this.options.next){
		snip._(this.options.next, function(){this.classList.add('snipSliderNext');});
		snip.on('click', this.options.next, function(){
			if(this.classList.contains('disabled')) return false;
			func.setPos(1);
		});
	}
	
	snip.on('resize', window, function(){// Bei Window-Resize SlideBar anpassen und Position wieder auf 0
		func.set();
		func.setPos(0);
	});
	
	if(!!this.options.auto){// Wenn auto-Option gesetzt ist, Intervall starten
		this.options.loop = true;
		this.auto = setInterval(function(){func.setPos(1);}, this.options.auto);
	}
	
}

// snip.maxZ()
// Gibt den minimalen Z-Index zurück der höher ist als alle anderen im Stack
// @param string|node  DOM-Selektor oder eine DOM-Node des Elements
// @param boolean  DOM-Selektor oder eine DOM-Node des Elements

snip.maxZ: function(element, sub){
  var maxZ = 0, sub = !!sub;
  if(typeof element=='undefined') element = 'body';
  element = snip._(element);
  if(!element) return maxZ;

  for (var i = 0; i < element.children.length; i++) {
    var item			= element.children[i],
      positioned		= ['absolute','relative','fixed','sticky'].includes(item.style.position),
      indexed			= positioned && item.style.zIndex && item.style.zIndex!='auto',
      stackingContext = indexed || (item.style.opacity && item.style.opacity < 1);

    if(stackingContext) maxZ = item.style.zIndex ? Math.max(maxZ, parseInt(item.style.zIndex)) : maxZ+1;
    else if(!sub){
      maxZ ++;
      if(item.children.length > 0)maxZ = Math.max(maxZ, snip.maxZ(item, true));
    }
  }
  return maxZ;
};

snip.setMaxZ: function(element, sub){
  var zIndex = snip.maxZ(element, sub);
  snip._(element, function(){this.style.zIndex = zIndex+1;})
  return zIndex;
};
