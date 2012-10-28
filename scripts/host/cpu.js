/* ------------  
   CPU.js

   Requires global.js.
   
   Routines for the host CPU simulation, NOT for the OS itself.  
   In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document envorinment inside a browser is the "bare metal" (so to speak) for which we write code
   that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
   JavaScript in both the host and client environments.

   This code references page numbers in the text book: 
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

function cpu()
{
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
    this.pcb = null;
    
    this.init = function() 
    {
        this.PC    = 0;
        this.Acc   = 0;
        this.Xreg  = 0;
        this.Yreg  = 0;
        this.Zflag = 0;      
        this.pcb = null;

        _InstructionSet = new InstructionSet6502(); // Initialize the instruction set for program execution.

    };
}

/**
 * Uses the pcb that the CPU is currently pointed to and generates the state for
 * the remainder of the CPU.
 */
cpu.prototype.setStateFromPCB = function(pcb)
{
    this.pcb   = pcb;
    this.PC    = pcb.PC;
    this.Acc   = pcb.Acc;
    this.Xreg  = pcb.Xreg;
    this.Yreg  = pcb.Yreg;
    this.Zflag = pcb.Zflag;
    
};



/**
 * The cycle funtion protoype for the cpu. Used in executing processes.
 */
cpu.prototype.cycle = function()
{
    var opcode = this.fetch();

    var instruction = this.decode(opcode);

    var contents = this.read( instruction);
    
    this.execute(instruction, contents);
};

/**
 * Retrieve the next instruction from the memory and increment the program counter.
 * 
 * @return The contents of the memory cell being fetched.
 */
cpu.prototype.fetch = function()
{
    
    return _MemoryManager.retrieveContents((this.PC++).toString(16), this.pcb);
};

/**
 * Decodes the instruction that has been fetched from memory.
 * 
 * @param opcode The opcode of the instruction.
 * 
 * @return The instruction object for the opcode.
 */
cpu.prototype.decode = function(opcode)
{
    return _InstructionSet.get(opcode);
};

/**
 * Reads the contents of the supplied memory address.
 * 
 * @param instruction The instruction to read the operands from.
 * 
 * @return An array of the operands.
 */
cpu.prototype.read = function(instruction)
{    
    // The 42 is the answer to the question of life the universe and everything,
    // but here it's a dummy fail condition...
    var count = 42;
    
    // Ensure the instruction is truthy.
    if(instruction)
    {
        count = instruction.argCount;
    }
    
    var contents = [];
    
    // Gets the operand from main memory.
    switch (count)
    {
        case 0:
            break;
        case 1:
            contents = [_MemoryManager.retrieveContents(this.PC.toString(16),
                            this.pcb)];
            this.PC ++;
            break;
        case 2:
            contents = _MemoryManager.retrieveContentsFromAddress(
                            this.PC.toString(16), 2, this.pcb);
            this.PC += 2;
            break;
        default:
            break;
    }
    return contents;
};

/**
 * Executes the instruction.
 * 
 * @param instruction The instruction to execute.
 * 
 * @param contents The operands for the instruction.
 */
cpu.prototype.execute = function(instruction, contents)
{
    if(instruction)
    {
        instruction.funct(contents,this);
    }
};

