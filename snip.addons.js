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
