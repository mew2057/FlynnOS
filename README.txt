Some Notes:
1. For loading I have the $0000 location hard coded in the function call. 
    This will change in the next version, but since I'm only loading one 
	at a time it seems to be a non issue for this part.
	
2. Load cycles is a new easter egg. wasd is red, arrows are blue and enter resets.

3. Single step is enabled by the right facing arrow with the dot under it. Stepping is 
	subsequently handled by clicking the second right arrow (clicking too fast in chrome
	highlights the displays firefox doesn't seem to have that issue).
	
4. The Memory Manager works, but I think I have too many functions in this revision of the 
	Operating System, when I fully implement paging I'll have a better idea of what functions
	I'll want to keep and which should be deep sixed.
	
5. I opted for function pointers for my instruction code and separated the definition of the instructions 
	and the actual implementation. This is predominantly because it made me feel slick and like I 
	knew what I was doing in JavaScript, just know I recognize that I could've simply used a switch statement.
	
6. I removed the executing field from the CPU prototype in favor of a pcb reference, since that seems
	to be more in line with the program flow we discussed in class.
	
7. My instructions handle two's complement internally and does two's complement translation for output.

8. Process Control Blocks are created by the ResidentList data structure in the pcb.js file. This 
	way pid allocation is consistant.
	a
9. There's occasionally a jquery issue when hiding the windows, but it's purely cosmetic and rare.

10. My process flow mimics the structure defined in class, I added a terminated queue just so you 
	can see the processes that have already completed execution.

11. I converted the OSTraps to interrupts to better match the discussions from class.

12. I disabled the idle logging, because it was getting obnoxious in testing.

13. PCBs only update when they leave execution and are placed on the ready queue or terminated queue.

14. Finally, my displays are generally in hex (with the only exception being the console).

Sorry about the long readme, but hunting all of this down in commments could get even more tedious than
this (although the comments tend to be pretty funny from time to time).
	