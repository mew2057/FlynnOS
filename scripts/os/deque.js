/*--------------
  Deque.js
    
    Like queue this is a "dressing up" of the array class to 
    ensure proper behavior when dealing with deques. 
    Follows the style conventions put forth in 
    http://javascript.crockford.com/code.html .
  
  --------------*/
function Deque () {
    this.d = [];
}

Deque.prototype.popBack = function () {
    var retVal = null;
    
    if (this.d.length >0) {
        retVal =  this.d.pop();     
    }    
    
    return retVal;
};

Deque.prototype.pushBack = function (element) {
    this.d.push(element);
};

Deque.prototype.popFront = function () {
    var retVal = null;
    
    if (this.d.length >0) {
        retVal =  this.d.shift();
    }    
    
    return retVal;
};

Deque.prototype.pushFront = function (element) {
    this.d.unshift(element);
};

Deque.prototype.getSize  = function () {
    return this.d.length;    
};

Deque.prototype.isEmpty  = function () {
    return (this.d.length === 0);    
};
    
Deque.prototype.toString = function () {
    var retVal = "";
    
    for (i in this.d) {
        retVal += this.d[i];
    }
    
    return retVal;
};