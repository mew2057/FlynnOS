/* -------------
    PriorityQueue.js
    A script containing a PriorityMinQueue data structure.
    
    If this resembles the VacSys project in any way, it is merely a coincidence.
    It's not like John reviewed his priority queues with his implementation of vacsys
    and then realized that the queues of multiple data would result 
    in more consistent completion times and faster heap rebuilds or anything...
   --------------*/

/**
 * Defines a priority queue with an array based heap implementation behind it.
 */
function PriorityMinQueue(){
    this.h = [];  
}

/**
 * Inserts a value into the queue based on priority. If the priority exists, it 
 * is enqueued to a queue at that location.
 * 
 * @param priority The priority of the element.
 * @param element The element being added to the queue.
 */
PriorityMinQueue.prototype.insert  = function (priority, element)
{
    if(!this.insertToExisting(priority,element))
    {
        this.h.push({"p":priority,"v":[element]});
        this.trickleUp(this.h.length - 1);
    }
};

/**
 * Checks the queue to see if a given priority exists, if found it is added to the 
 * queue at the locaction.
 * @param priority The priority of the element.
 * @param element The element being added to the queue.
 */
PriorityMinQueue.prototype.insertToExisting = function(priority,element)
{
    for(var index in this.h)
    {
        if(this.h[index].p === priority)    
        {
            this.h[index].v.push(element);
            return true;
        }
    }
    
    return false;   
};

/**
 * Performs the trickle up for heap insertions.
 * 
 * @param index The index of the element to attempt to trickle up the heap.
 */
PriorityMinQueue.prototype.trickleUp = function(index)
{

    // This is equivalent to a floor function in JavaScript.
    var parent = ((index - 1)/2) >> 0;

    // Checks to see if the priority of the checked queue is less than that
    // of its parent in the heap. If so swap them in place in the array.
    if(index !== 0 && this.h[index].p < 
        this.h[parent].p)
    {
        this.h.push(this.h[parent]);
        this.h[parent] = this.h[index];
        this.h[index] = this.h.pop();
        
        this.trickleUp(parent);
    }
};

/**
 * Removes an element from the queue.
 * @return The element if it is present.
 */
PriorityMinQueue.prototype.remove = function()
{
    var toReturn = null;
    
    if(this.h.length > 0)
    {
        toReturn = this.h[0].v.shift();
        
        if(this.h[0].v.length === 0)
        {
            if(this.h.length > 1)
            {
                this.h[0] = this.h.pop();
                this.heapRebuild(0);
            }
            else
            {
                this.h = [];   
            }
        }
    }
    return toReturn;
};

/**
 * Performs the heap rebuild for removals queue removals.
 * @param index The index of the current position of the rebuild.
 * 
 */
PriorityMinQueue.prototype.heapRebuild = function(index)
{
    if(this.h.length > 2 * index + 1)
    {
        var smallestChild = 2 * index + 1;
        
        // Compares children.
        if(this.h.length > smallestChild + 1 && 
            this.h[smallestChild].p > this.h[smallestChild + 1].p )
        {
            smallestChild++;
        }
        
        // Checks parent with smallest child.
        if(this.h[index].p > this.h[smallestChild].p)
        {
            this.h.push(this.h[smallestChild]);
            this.h[smallestChild] = this.h[index];
            this.h[index] = this.h.pop();
            
            this.heapRebuild(smallestChild);
        }        
    }
};

/**
 * @return true if empty...
 */
PriorityMinQueue.prototype.isEmpty = function()
{
    return this.h.length === 0;
};

PriorityMinQueue.prototype.clean = function()
{
    delete this.h;   
};

PriorityMinQueue.prototype.toString = function()
{
    var pqString = "";
    for(var qIndex in this.h)
    {
        for(var eIndex in this.h[qIndex].v)
        {
            pqString += this.h[qIndex].v[eIndex].toString() + " ";
        }
    }
    return pqString;
};
