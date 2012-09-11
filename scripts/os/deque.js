/*--------------
  Deque.js
    
    Like queue this is a "dressing up" of the array class to 
    ensure proper behavior when dealing with deques. 
    Follows the style conventions put forth in 
    http://javascript.crockford.com/code.html .
    The code is all pretty standard.
  
  --------------*/
function Deque () {
    this.d = [];
}

Deque.prototype.length = function() {
    return this.d.length;   
};

Deque.prototype.popBack = function () {
    var retVal = null;
    
    if (this.d.length >0) {
        retVal =  this.d.pop();     
    }    
    
    return retVal;
};

Deque.prototype.peekBack = function () {
    var retVal = null;
    
    if (this.d.length > 0) {
        retVal =  this.d[this.d.length-1];     
    }    
    
    return retVal;
};

Deque.prototype.peekFront = function () {
    var retVal = null;
    
    if (this.d.length > 0) {
        retVal =  this.d[0];     
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
    
    for (var i in this.d) {
        retVal += this.d[i];
    }
    
    return retVal;
};
