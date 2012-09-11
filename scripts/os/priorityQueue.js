    /*
        priorityQueue.js
        uses queue.js
        This implementation is designed to ensure that as calls enter the queue 
        with a priority they keep the order in which they had been executed (internally).
        This has not yet been implemented in the actual kernel as of 9/8/12.
    */

function PriorityQueue () {
    this.pq = [];
}

PriorityQueue.prototype.enqueue = function(element, priority)
{
    var missing =true;
    for (var index in this.pq)
    {
        if(this.pq[index][1])
        {
            this.pq[index][0].enqueue(element);          
            missing = false;
        }
    }
    
    if(missing)
    {
        this.pq.push([element, priority]);
    
        this.swapUp(this.pq.length - 1);
    }
};

PriorityQueue.prototype.dequeue = function()
{
    var element = this.pq[0][0].dequeue();
    
    if(this.pq[0][0].length() == 0)
    {
        this.pq[0] = this.pq[this.pq.length -1];
        this.pq.pop();
        
        this.swapDown(0);
    }
    return element;
};

PriorityQueue.prototype.swapUp = function(currentIndex)
{
    var parent = Math.floor(currentIndex/2);
    
    if (currentIndex != 0 && 
        this.pq[currentIndex][1] > this.pq[parent][1])
    {
        var temp = this.pq[currentIndex];    
        
        this.pq[currentIndex] = this.pq[parent];
        this.pq[parent] = temp;       
        
        this.swapUp(parent);
    }
};

PriorityQueue.prototype.swapDown = function(currentIndex)
{
    var largestChild = this.pq[2*currentIndex + 1][1] >= 
        this.pq[2*currentIndex + 2][1] ? 2*currentIndex + 1 : 2*currentIndex + 2;
        
        
    if(this.pq[largestChild][1] > this.pq[currentIndex][1])
    {
        var swap = this.pq[currentIndex];
        
        this.pq[currentIndex] = this.pq[largestChild];
        this.pq[largestChild] = swap;
        
        this.swapDown(largestChild);
    }
};

