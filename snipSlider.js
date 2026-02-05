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
			let prevButton = this;
			if(prevButton.classList.contains('disabled')) return false;
			prevButton.classList.add('disabled'); setTimeout(function(){prevButton.classList.remove('disabled');}, 50);
			func.setPos(-1);
		});
	}
	if(!!this.options.next){
		snip._(this.options.next, function(){this.classList.add('snipSliderNext');});
		snip.on('click', this.options.next, function(){
			let nextButton = this;
			if(nextButton.classList.contains('disabled')) return false;
			nextButton.classList.add('disabled'); setTimeout(function(){nextButton.classList.remove('disabled');}, 50);
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
