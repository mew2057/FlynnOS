
function CoreMemory(memorySize)
{
    this.memory = [];

    for (var index =0 ; index < memorySize; index ++)
    {
        this.memory.push("00");   
    }
}
