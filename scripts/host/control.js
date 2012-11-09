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
    $("#logDiv").text("");

    
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
   // var str = "{ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now  + " }"  + "\n";    
    // Update the log console.
    var str = '<tr class="' + source + '"><td>' + clock + '</td><td class="src">' + source + ":</td><td>" + msg + "</td></tr>";

    // The length of the div exceeds the globally defined character limit   
    // wipe out the final half of characters.(note this is actually the "first")
    // Please note this purposefully ignores tags on the check.
    if( $("#logDiv").text().length > LOG_CHAR_LIMIT)
    {
        var txt = $("#logDiv").html();
        $("#logDiv").html(txt.substr(0, txt.indexOf("</tr>", LOG_CHAR_LIMIT/2)));
    }
    $("#logDiv").prepend(str + "<br/>");
    // Optionally udpate a log database or some streaming service.
}

function simClearLog(msg, source)
{
    $("#logDiv").text("");
}


//
// Control Events
//
function simBtnStartOS_click()
{    
    // .. set focus on the OS console display ... 
    document.getElementById("display").focus();

    
    // ... Create and initialize the CPU ...
    _CPU = new cpu();
    _CPU.init();

    // ... then set the clock pulse simulation to call ?????????.
    hardwareClockID = setInterval(simClockPulse, CPU_CLOCK_INTERVAL);
    
    // Then establish the core memory.
    _CoreMemory = new CoreMemory();
    _CoreMemory.init();
    
    // .. and call the OS Kernel Bootstrap routine.
    krnBootstrap();
    

}

function simBtnHaltOS_click()
{
    simLog("emergency halt", LOGGER_SOURCE.HOST);
    simLog("Attempting Kernel shutdown.",LOGGER_SOURCE.HOST);
    // Call the OS sutdown routine.
    krnShutdown();
    // Stop the JavaScript interval that's simulating our clock pulse.
    clearInterval(hardwareClockID);
    // TODO: Is there anything else we need to do here?
}

function simBtnReset_click()
{
    //location.reload(true);  
    // Shutdown the kernel and clearout the clock. The rest will be handled by the GC.
    if(_OSclock > 0)
    {
        globalReset();
        krnShutdown();
        _OSclock = 0;
        simClearLog(); // Clears the log
    
        // Start the host again.
        simBtnStartOS_click();
    }
}

/**
 *  Loads the program from the textarea. 
 */
function simLoadProgram()
{   
    // I enforce characters between hex pairs on one line, but spaces and new 
    // lines make for sticky situations handled by this line of code.
    var program = document.getElementById('taExtProgs').value.toLowerCase().replace(/[ ]*\n[ ]*/g," ").trim();
    
    return program;
}
