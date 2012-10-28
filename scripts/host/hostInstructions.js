/* ------------
   hostInstructions.js
   
   Requires globals.js, cpu.js, interrupt.js
   
   Routines for the Instruction Set of the cpu. Please note that philosophically
   this is "in" the CPU, but I separated it for clarity and readbility's sake.
   ------------ */

/**
 * LDA - LoaD the Accumulator: Loads the accumulator with either a constant 
 * (1 operand) or the contents of a memory location (2 operand). If too many 
 * operands are detected a minor fault is thrown.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostLoadAcc(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Acc = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        cpu.Acc = parseInt(_MemoryManager.retrieveContents(hexValues[1] + 
            hexValues[0], cpu.pcb),16);
    }
    else
    {
        _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
            new Array(INST_FAULT,"Too many operands for LDA.")));
    }
    console.log("host ACC "  + cpu.Acc);
}


/**
 * STA - Store The Accumulator: Stores the contents of the accumulator to a 
 * memory location specified in the operands.
 * 
 * @param hexValues The operands of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostStoreAcc(hexValues,cpu)
{
    _MemoryManager.store(hexValues[1] + 
        hexValues[0], [padZeros(cpu.Acc.toString(16),2)], cpu.pcb);
}

/**
 * ADC - ADd with Carry: Adds the contents of the Accumulator to the contents of
 * the memory position pointed to by the operand.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostAddWithCarry(hexValues,cpu)
{
    var memContents = _MemoryManager.retrieveContents(hexValues[1] +
        hexValues[0], cpu.pcb);
    
    if(memContents)
    {
        //As this is implicitly two's complement this will suffice.
        cpu.Acc = (cpu.Acc + parseInt(memContents,16)) % 256;
    }
    else
    {        
        _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
            new Array(MEM_FAULT,"Memory Address was unable to be read for ADC.")));
    }
}

/**
 * LDX - LoaD the X register: Loads the X register with either a constant 
 * (1 operand) or the contents of a memory location (2 operand). If too many 
 * operands are detected a minor fault is thrown.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostLoadX(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Xreg = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        
        cpu.Xreg =parseInt(_MemoryManager.retrieveContents(hexValues[1] + 
            hexValues[0], cpu.pcb),16);
    }
    else
    {
        _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
            new Array(INST_FAULT,"Too many operands for LDX.")));
    }
}

/**
 * LDY - LoaD the Y register: Loads the Y register with either a constant 
 * (1 operand) or the contents of a memory location (2 operand). If too many 
 * operands are detected a minor fault is thrown.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostLoadY(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Yreg = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        cpu.Yreg = parseInt(_MemoryManager.retrieveContents(hexValues[1] + 
            hexValues[0], cpu.pcb),16);
    }
    else
    {
        _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
            new Array(INST_FAULT,"Too many operands for LDY.")));
    }   
}

/**
 * NOP - No OPeration: Literally performs no operations.
 */
function hostNOP(){}

/**
 * CPX - ComPare X register: Compares the contents of the X register with the 
 * contents of the supplied memory address and loads the result of the boolean
 * expression into the Z flag.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostCompareX(hexValues,cpu)
{
    var toCompare = parseInt(_MemoryManager.retrieveContents(hexValues[1] + 
        hexValues[0], cpu.pcb), 16);
    
    if(toCompare != null && toCompare >=0)
    {
        //console.log(cpu.Xreg,toCompare,(cpu.Xreg == toCompare? 1 : 0));
        cpu.Zflag = cpu.Xreg == toCompare? 1 : 0;
    }
    else
    {      
        _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
            new Array(MEM_FAULT,"Memory Address was unable to be read for CPX.")));
    }
    
}

/**
 * BNE - Branch Not Equal: Branches the number of bytes specified in the operand
 * as a two's complement integer if the Z flag is NOT set. The branched address 
 * is relative to the current Program Counter value.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostBranchNotEqual(hexValues,cpu)
{
    if(cpu.Zflag === 0)
    {
        var branchAddress = parseInt(hexValues[0],16);
        /*
         * As the leading bit carries the sign of the number in two's complement
         * And our CPU is 8bit 128 and a bitwise or will extract the important bit.
         * If the leading bit is 1 then the result is truthy and it is necessary
         * to do some work.
         */
        if(128 & branchAddress )
        {
            cpu.PC -= (256 - branchAddress);
        }
        else
        {
            cpu.PC += branchAddress;
        }
    }
}

/**
 * INC - INCrement byte: Increments the contents of the memory address at operand
 * by one.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostIncrementByte(hexValues,cpu)
{
    var hexAddress = hexValues[1] + hexValues[0];
    
    var contents = parseInt(_MemoryManager.retrieveContents(hexAddress, cpu.pcb),16);
    
    var incrementedValue = (( contents + 1) % 256).toString(16);
        
    _MemoryManager.store(hexAddress,[padZeros(incrementedValue,2)],cpu.pcb);
}

/**
 * BRK - BReak: Breaks the execution of the process.
 * 
 * @param hexValues N/A
 * @param cpu The cpu that this instruction addresses.
 */
function hostBreakProcess(hexValues,cpu)
{
    _KernelInterruptQueue.enqueue(new Interrupt(BRK_IRQ, new Array(cpu)));
}

/**
 * SYS - SYStem call: Raises a System Call interrupt for the kernel to process.
 * Xreg == 1 : Prints the contents of the Y register.
 * Xreg == 2 : Prints the contents of memory from the address in the Y register
 *              to the first occurrence of 00 in the core memory as a String.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostSystemCall(hexValues,cpu)
{
    _KernelInterruptQueue.enqueue(new Interrupt(SYSTEM_IRQ, new Array(cpu.Xreg, 
        cpu.Yreg)));
}

