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
    this.isExecuting = false;
    
    this.init = function() 
    {
        this.PC    = 0;
        this.Acc   = 0;
        this.Xreg  = 0;
        this.Yreg  = 0;
        this.Zflag = 0;      
        this.isExecuting = false;  
    };
}

/**
 * The cycle funtion protoype for the cpu.
 * @param manager The memory manager.
 * @param instructions The instruction set that is used by the cpu.
 */
cpu.prototype.cycle = function(manager,instructions,inputStream)
{
    var opcode = this.fetch(manager);

    var instruction = this.decode(instructions, opcode);

    var contents = this.read(manager, instruction);

    this.execute(instruction, contents);
};

/**
 * Retrieve the next instruction from the memory and increment the program counter.
 * @param manager The memory manager containing a reference to the core memory.
 * @return The contents of the memory cell being fetched.
 */
cpu.prototype.fetch = function(manager)
{
    
    return manager.retrieveContents((this.PC++).toString(16));
};

/**
 * Decodes the instruction that has been fetched from memory.
 * 
 * @param instructions The instruction set that contains the opcode.
 * @param opcode The opcode of the instruction.
 * @return The instruction object for the opcode.
 */
cpu.prototype.decode = function(instructions, opcode)
{
    return instructions.get(opcode);
};

/**
 * Reads the contents of the supplied memory address.
 * 
 * @param manager The memory management object containing a reference to main memory.
 * @param instruction The instruction to read the operands from.
 * 
 * @return An array of the operands.
 * 
 */
cpu.prototype.read = function(manager, instruction)
{    
    var count = 42;
    
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
            contents = [manager.retrieveContents(this.PC.toString(16))];
            this.PC ++;
            break;
        case 2:
            contents = manager.retrieveContentsFromAddress(this.PC.toString(16),2);
            this.PC += 2;
            break;
        default:
            break;
    }
    return contents;
};

/**
 * Executes the instruction.
 * @param instruction The instruction to execute.
 * @param contents The operands for the instruction.
 */
cpu.prototype.execute = function(instruction, contents)
{
    if(instruction)
    {
        instruction.funct(contents,this);
    }
};

