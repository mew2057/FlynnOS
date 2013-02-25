/* ------------
   Kernel.js
   
   Requires globals.js
   
   Routines for the Operataing System, NOT the host.
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5   
   ------------ */


//
// OS Startup and Shutdown Routines   
//
function krnBootstrap()      // Page 8.
{
    simLog("bootstrap",LOGGER_SOURCE.HOST);  // Use simLog because we ALWAYS want this, even if _Trace is off.    


    // Initialize our global queues.
    _KernelInterruptQueue = new Queue();    // A (currently) non-priority queue for interrupt requests (IRQs).
    _KernelBuffers = new Array();           // Buffers... for the kernel.
    _KernelInputQueue = new Queue();        // Where device input lands before being processed out somewhere.
    _Console = new Console();               // The console output device.
    _MemoryManager = new MemoryManager(_CoreMemory); // Creates a memory manager linked to core memory.
    _MemoryManager.init();                  // Initializes the memory manager.
    _Residents = new ResidentList();        // Contains loaded PCBS.
    _Terminated = new Queue();              // Contains the pcbs that have executed.
    _StepEnabled = false;                   // Ensures that Stepping is off on load.
    _Step = false;                          // Clears out the Step.
    _Scheduler = new RoundRobin();          // Initializes the scheduler.

    // Load the Display Device Driver.
    krnTrace("Loading the display device driver.");
    krnDisplayDriver = new DeviceDriverDisplay();    
    krnDisplayDriver.driverEntry();
    krnTrace(krnDisplayDriver.status);
    
    krnTrace("Loading the disk device driver.");
    krnDiskDriver = new DeviceDriverDisk();
    krnDiskDriver.driverEntry();
    krnTrace(krnDiskDriver.status);

    // Initialize the Console.
    _Console.init();

    // Initialize standard input and output to the _Console.
    _StdIn  = _Console;
    _StdOut = _Console;
  
    // Sets up the disk, may work somewhere else better...
    DiskFormat();

    // Load the Keyboard Device Driver
    krnTrace("Loading the keyboard device driver.");
    krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it. 
    krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
    krnTrace(krnKeyboardDriver.status);
    
    
    
    // 
    // ... more?
    //
    initPCBDisplay();
    getFSTable();

    // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
    krnTrace("Enabling the interrupts.");
    krnEnableInterrupts();
    // Launch the shell.
    krnTrace("Creating and Launching the shell.");
    _OsShell = new Shell();
    _OsShell.init();
}

function krnShutdown()
{
    krnTrace("begin shutdown OS");
    // TODO: Check for running processes.  Alert if there are some, alert and stop.  Else...    
    // ... Disable the Interruupts.
    krnTrace("Disabling the interrupts.");
    krnDisableInterrupts();
    // 
    // Unload the Device Drivers?
    // More?
    //
    krnTrace("end shutdown OS");
}

function krnOnCPUClockPulse() 
{
    /* This gets called from the host hardware every time there is a hardware clock pulse. 
       This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
       This, on the other hand, is the clock pulse from the hardware (or host) that tells the kernel 
       that it has to look for interrupts and process them if it finds any.                           */

    // Check for an interrupt, are any. Page 560
    
    if (_KernelInterruptQueue.getSize() > 0)    
    {
        // Process the first interrupt on the interrupt queue.
        // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
        var interrupt = _KernelInterruptQueue.dequeue();

        krnInterruptHandler(interrupt.irq, interrupt.params);        
    }
    else if (_Scheduler.processEnqueued && (!_StepEnabled || (_StepEnabled && _Step))) // If there are no interrupts then run a CPU cycle if there is anything being processed.
    {        
        // User mode for cpu instructions.
        _Mode = 1;
        if(_CPU.pcb)
        {
            _CPU.cycle();
            _Step = false;
        }
        // Kernel mode for kernel operations.
        _Mode = 0;   
        
        // This goes after the cycle to easily handle interrupt collisions 
        // (eg a break and context switch) There is a wasted cycle regardless 
        // when scheduling.
        _Scheduler.isReady();   


    }
    else                       // If there are no interrupts and there is nothing being executed then just be idle.
    {
        //I disabled Idle, because it was annoying.
    //   krnTrace("Idle");
    }
    
    // Update the status and time in the task bar.
    updateTaskBar();
    updateCPUDisplay(_CPU);
    updatePCBDisplay([_Residents,_Scheduler,_Terminated,_CPU.pcb]);
}


// 
// Interrupt Handling
// 
function krnEnableInterrupts()
{
    // Keyboard
    simEnableKeyboardInterrupt();
    
    
    // Put more here.
}

function krnDisableInterrupts()
{
    // Keyboard
    simDisableKeyboardInterrupt();
    // Put more here.
}

function krnInterruptHandler(irq, params)    // This is the Interrupt Handler Routine.  Page 8.
{
    // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on.  Page 766.
    krnTrace("Handling IRQ~" + irq);

    // Save CPU state. (I think we do this elsewhere.)
    
    // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
    // TODO: Use Interrupt Vector in the future.
    // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.  
    //       Maybe the hardware simulation will grow to support/require that in the future.
    switch (irq)
    {
        case TIMER_IRQ: 
            krnTimerISR();                   // Kernel built-in routine for timers (not the clock).
            break;
        case KEYBOARD_IRQ: 
            krnKeyboardDriver.isr(params);   // Kernel mode device driver
            _StdIn.handleInput();
            break;
        case SYSTEM_IRQ:
            krnSystemCallISR(params);
            break;
        case FAULT_IRQ:
            krnFaultISR(params);
            break;
        case BRK_IRQ:
            krnBreakISR(params);
            break;
        case TRAP_IRQ:
            krnTrapError(params[0]);
            break;
        case CONTEXT_IRQ:
            krnContextSwitch(params);
            break;
        case DISK_IRQ:
            krnDiskDriver.isr(params);
            // Update the display for the disk if a disk interrupt occurs, this probably shouldn't go here, but it works.
            getFSTable();
            break;
        default: 
            krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
    }

    // 3. Restore the saved state.  TODO: Question: Should we restore the state via IRET in the ISR instead of here? p560.
}

function krnTimerISR()  // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver).
{
    // Check multiprogramming parameters and enfore quanta here. Call the scheduler / context switch here if necessary.
}   

/**
 * Outputs the supplied fault to the console.
 * @params param[0] - Fault type.
 *         param[1] - Fault message.
 */
function krnFaultISR(params)
{
    var message = "";
    
    // Multiple fault types share this interrupt.
    switch(params[0])
    {
        case INST_FAULT:
            message = "Instruction Fault:";
            break;
        case CPU_FAULT:
            message = "CPU Fault:";
            break;
        case MEM_FAULT:
            message = "Memory Fault:";
            break;
    }

    _StdIn.putText(message + " " + params[1]);

    //kill process if fault came from the CPU. ( not all memory faults come from the cpu).
    if((params[0] === INST_FAULT || params[0] === CPU_FAULT) && params[2].pcb != null)
    {
        _OsShell.drop();
        krnKillProcess(params[2].pcb.pid);
    }
    else
    {
        _OsShell.drop();
    }
    
}

/**
 * Removes the PCB from the ready queue (this is subject to change as I develop 
 * the Scheduler).
 * 
 * @params  param 0 - boolean value for whether or not the execution is finished.
 */
function krnBreakISR(params)
{
    _Scheduler.breakExecution(params[0]);
}

/**
 * Executes a system call using the parameter list supplied CPU.
 * @param An array containing a cpu object to be used in executing a system call.
 */
function krnSystemCallISR(params)
{
    switch(params[0])
    {
        case 1:
            // Output the contents of the Y register.
            var toOutput = params[1];
            
            //Assumes the contents are Two's complement.
            if (128 & toOutput)
            {
                toOutput = -(256 - toOutput);   
            }
            
            // I add the null character so it is viewed as a character.
            _StdIn.putText(toOutput + "");
            break;
        case 2:
            // Get the String of characters from the core memory through the 
            // manager.
            var outputChars = _MemoryManager.retrieveContentsToLimit(
                    params[1].toString(16), "00", params[2]);
            
            // If the memory request was successful, output the string.
            if(outputChars)
            {
                for(var index in outputChars)
                {
                    _StdIn.putText(String.fromCharCode(parseInt(outputChars[index],16)));
                }
            }
            else 
            {
                // Notifies the user that the "string" in memory was not properly terminated.
                _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
                    new Array(MEM_FAULT,"Memory overflow on system call." +
                    "Memory String did not have a valid termination.")));
            }
            break;
        default:
            // Notifies the user that the System Call type was unsupported.
            _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
                new Array(INST_FAULT,"Unsupported system call type.", _CPU)));
            break;
    }
}


//
// OS Utility Routines
//
function krnTrace(msg)
{
   // Check globals to see if trace is set ON.  If so, then (maybe) log the message. 
   if (_Trace)
   {
      if (msg === "Idle")
      {
         // We can't log every idle clock pulse because it would lag the browser very quickly.
         if (_OSclock % 10 == 0)  // Check the CPU_CLOCK_INTERVAL in globals.js for an 
         {                        // idea of the tick rate and adjust this line accordingly.
            simLog(msg, LOGGER_SOURCE.OS);          
         }         
      }
      else
      {
       simLog(msg, LOGGER_SOURCE.OS);
      }
   }
}
   
/**
 * The OSOD, master control is NOT pleased with you.
 * 
 * @param msg The error message.
 */
function krnTrapError(msg)
{
    simLog("OS ERROR - TRAP: " + msg);
     
    _Console.trapScreen("I'M WARNING YOU. YOU'RE ENTERING A BIG ERROR, " + _UserName.toUpperCase() + ": " + msg);    
    krnShutdown();
}

/**
 * Performs a context switch...
 * @param params 0 - The status of the program.
 */
function krnContextSwitch(params)
{
    _Scheduler.processNext(_CPU,params[0]);
}

/**
 * Checks to ensure that each instruction in a program String has a valid 
 * corresponding Instruction in the Instruction Set.
 * 
 * @param program The String form of a user program to be loaded to memory.
 * 
 * @return An array containing op codes if valid, null if any op codes were bad.
 */
function krnVerifyInstructions(program)
{
    var splitProgram = program.split(" ");   
    
    for( var index = 0; index < splitProgram.length; index++)
    {
        var opCode = _InstructionSet.get(splitProgram[index]);
        
        if(splitProgram[index] === '00')
        {
            break;
        }
        
        if(opCode)
        {
            index += opCode.argCount;
        }
        else 
        {
            return null;
        }
    }
    
    return splitProgram;
}

/**
 * Verifies that the program has valid instructions then loads it into core 
 * memory and assigns a pid which is returned to the user via console.
 * 
 * @param priority The priority of the program.
 */
function krnLoadProgram(priority)
{
    var program = simLoadProgram();
    
    if(!checkForHex(program))
    {
        program = null;  
    }  
    
    if(program)
    {       
        var verifiedIntructions = krnVerifyInstructions(program);
        
        if(verifiedIntructions)
        {
            var pid = _MemoryManager.storeProgram(verifiedIntructions, _Residents);
                
            if(pid >= 0)
            {                
                _StdIn.putText( "I feel a presence. Another warrior is on the "+
                    "mesa at pid: " + pid);
                
                if(priority >= 0)
                {
                    _Residents.getBlock(pid).priority = priority;
                }
                else if(priority && priority < 0)
                {
                    _StdIn.putText( "Priority must be non negative.");
                }
            }                
        }
        else
        {
            _StdIn.putText("An invalid instruction was detected in your program.");   
        }
    }
    else
    {
        _StdIn.putText("Please verify that your program only has paired Hexidecimal characters " +
            "and non continuous whitespace.");   
    } 
}

/**
 * Runs the program with the supplied proces ID on the kernel.
 * 
 * @param pid The Process ID to run.
 */
function krnRunProgram(pid)
{
    // Pop the pid from the resident list and store the pcb to add to the ready queue.
    var pcb = _Residents.popBlock(pid);
    
    if(pcb)
    {           
       _Scheduler.scheduleProcess(_CPU, pcb);
    }
    else
    {
        _StdIn.putText("This warrior wasn't present on the mesa.");   
    }
    
}

/**
 * Runs all of the resident processes on the resident list.
 */
function krnRunResidents()
{
    for(var index = 0, length = _Residents.getSize(); index < length; index++)
    {
        _Scheduler.scheduleProcess(_CPU, _Residents.popBlock());
    }
}


/**
 * Sets the quantum of the Round Robin scheduler.
 * 
 * @param quantum Dr. Beckett's new... The new quantum for a round robin scheduler.
 */
function krnSetQuantum(quantum)
{
    // If the quantum is a valid number and the scheduler has a quantum set the quantum.
    if(_Scheduler.setQuantum)
    {
        _Scheduler.setQuantum(quantum);
    }
    else
    {
        _StdIn.putText("The scheduler doesn't have a quantum.");
    }
}

/**
 * Displays the current quantum of the Scheduler (if found).
 */
function krnGetQuantum()
{
    // If  the scheduler has a quantum display it.
    if(_Scheduler.getQuantum)
    {
       _StdIn.putText("Quantum:" + _Scheduler.getQuantum());
    }
    else
    {
        _StdIn.putText("The scheduler doesn't have a quantum.");
    }
}


/**
 * Retrieves a list of presently executing process identifiers.
 * 
 * @return A string of pids that are either active on the CPU or ready queue.
 */
function krnActivePIDS ()
{
    return _Scheduler.activesToString(_CPU);
}


/**
 * Kills the executing process with matching pid.
 * 
 * @param pid The process to stop.
 */
function krnKillProcess(pid)
{    
    _Scheduler.removeFromSchedule(_CPU, parseInt(pid,10));
}

/**
 * Checks with the scheduler to see if a process is executing or queued to execute.
 */
function krnCheckExecution()
{
    return _Scheduler.processEnqueued;
}

/**
 * Invokes the ISR for the fs with the create flag.
 * 
 * @param fileName The new file name.
 * @param callBack The function the is to be invoked on completion.
 */
function krnDiskCreate(fileName, callBack)
{
    _KernelInterruptQueue.enqueue(new Interrupt(DISK_IRQ,
        [FS_OPS.CREATE,fileName, null, callBack ? callBack : krnPutAndDrop]));
}

/**
 * Invokes the ISR for the fs with the read flag.
 * 
 * @param fileName The file name.
 * @param literal Sepcifies whether or no the response for be an array or string (true:array)
 * @param callBack The function the is to be invoked on completion.
 */
function krnDiskRead(fileName, literal, callBack)
{
    _KernelInterruptQueue.enqueue(new Interrupt(DISK_IRQ,
        [FS_OPS.READ, fileName, literal, callBack ? callBack : krnPutAndDrop]));
}

/**
 * Invokes the ISR for the fs with the write flag.
 * 
 * @param fileName The file name.
 * @param data The data to write to the file, is a string.
 * @param callBack The function the is to be invoked on completion.
 */
function krnDiskWrite(fileName, data, callBack)
{
    _KernelInterruptQueue.enqueue(new Interrupt(DISK_IRQ,
        [FS_OPS.WRITE, fileName, data, callBack ? callBack : krnPutAndDrop]));
}

/**
 * Invokes the ISR for the fs with the delete flag.
 * 
 * @param fileName The file name.
 * @param callBack The function the is to be invoked on completion.
 */
function krnDiskDelete(fileName, callBack)
{
    _KernelInterruptQueue.enqueue(new Interrupt(DISK_IRQ,
        [FS_OPS.DELETE, fileName, null, callBack ? callBack : krnPutAndDrop]));
}

/**
 * Invokes the ISR for the fs with the format flag.
 * 
 * @param callBack The function the is to be invoked on completion.
 */
function krnDiskFormat(callBack)
{
    _KernelInterruptQueue.enqueue(new Interrupt(DISK_IRQ,
        [FS_OPS.FORMAT, null, null, callBack ? callBack : krnPutAndDrop]));
}

/**
 * Invokes the ISR for the fs with the ls flag.
 * 
 * @param callBack The function the is to be invoked on completion.
 */
function krnDiskLS(callBack)
{
    _KernelInterruptQueue.enqueue(new Interrupt(DISK_IRQ,
        [FS_OPS.LS, null, null, callBack ? callBack : krnPutAndDrop]));
}

/**
 * Writes the text to the console and drops the line down.
 * 
 * @param text A message to output.
 */
function krnPutAndDrop(text)
{
    _StdIn.putText(text);
    _OsShell.drop();
}

/**
 * Sets the scheduler to the supplied, approved sceduler.
 * @param newScheduler the new scheme for the scheduler.
 */
function krnSetScheduler(newScheduler)
{
    if(_Scheduler.processEnqueued)
    {
        _StdIn.putText("Please wait for executing processes to complete!");
    }
    else if(_Scheduler.name === newScheduler)
    {
        _StdIn.putText("Scheduler is already in use!");
    }
    else if(newScheduler === "fcfs")
    {
        _Scheduler = new FCFS();
        _StdIn.putText("New Scheduler is " + _Scheduler.name);
    }
    else if(newScheduler === "rr")
    {
        _Scheduler = new RoundRobin();
        _StdIn.putText("New Scheduler is " + _Scheduler.name);
    }
    else if(newScheduler === "priority")
    {
        _Scheduler = new Priority();
        _StdIn.putText("New Scheduler is " + _Scheduler.name);
    }
    else
    {
        _StdIn.putText("Scheduler "+  newScheduler+ " not found, supported schedulers include: [fcfs,rr,priority]")
    }
}

/**
 * Retrieves and displayes the current scheduler type.
 */
function krnGetScheduler()
{
    _StdIn.putText("Scheduler employed is " + _Scheduler.name);
}
