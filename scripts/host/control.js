/* ------------  
   Control.js

   Requires global.js.
   
   Routines for the hardware simulation, NOT for our client OS itself. In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document envorinment inside a browser is the "bare metal" (so to speak) for which we write code that
   hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using JavaScript in 
   both the host and client environments.
   
   This (and other host/simulation scripts) is the only place that we should see "web" code, like 
   DOM manipulation and JavaScript event handling, and so on.  (Index.html is the only place for markup.)
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */


//
// Control Services
//
function simInit()
{
    // Clear the log text box.
    document.getElementById("taLog").value="";   
    
}

function simLog(msg, source)
{
    // Check the source.
    if (!source)
    {
        source = "?";
    }

    // Note the OS CLOCK.
    var clock = _OSclock;

    // Note the REAL clock in milliseconds since January 1, 1970.
    var now = new Date().getTime();

    // Build the log string.   
    var str = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now  + " })"  + "\n";    
    // WAS: var str = "[" + clock   + "]," + "[" + now    + "]," + "[" + source + "]," +"[" + msg    + "]"  + "\n";

    // Update the log console.
    taLog = document.getElementById("taLog");
    taLog.value = str + taLog.value;
    // Optionally udpate a log database or some streaming service.
}


//
// Control Events
//
function simBtnStartOS_click()
{    
    // .. set focus on the OS console display ... 
    document.getElementById("display").focus();
    
    var boxes = document.getElementsByClassName("textBox"); 
    
    for( var index =0; index < boxes.length; index ++)
    {
        boxes[index].style.visibility = 'visible';
    }
    
    // ... Create and initialize the CPU ...
    _CPU = new cpu();
    _CPU.init();

    // ... then set the clock pulse simulation to call ?????????.
    hardwareClockID = setInterval(simClockPulse, CPU_CLOCK_INTERVAL);
    // .. and call the OS Kernel Bootstrap routine.
    krnBootstrap();
}

function simBtnHaltOS_click()
{
    simLog("emergency halt", "host");
    simLog("Attempting Kernel shutdown.", "host");
    // Call the OS sutdown routine.
    krnShutdown();
    // Stop the JavaScript interval that's simulating our clock pulse.
    clearInterval(hardwareClockID);
    // TODO: Is there anything else we need to do here?
}

function simBtnReset_click()
{
    // The easiest and most thorough way to do this is to reload (not refresh) the document.
    location.reload(true);  
    // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
    // be reloaded from the server. If it is false or not specified, the browser may reload the 
    // page from its cache, which is not what we want.
}
