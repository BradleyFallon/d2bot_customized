/**
*	@filename	OrgTorch.js
*	@author		kolton
*	@desc		Convert keys to organs and organs to torches. It can work with TorchSystem to get keys from other characters
*	@notes		Search for the word "Start" and follow the comments if you want to know what this script does and when.
*/

function OrgTorch() {
	this.doneAreas = [];

	// Identify & mule
	this.checkTorch = function () {
		if (me.area === 136) {
			Pather.moveTo(25105, 5140);
			Pather.usePortal(109);
		}

		Town.doChores();

		if (!Config.OrgTorch.MakeTorch) {
			return false;
		}

		var item = me.getItem("cm2");

		if (item) {
			do {
				if (item.quality === 7 && Pickit.checkItem(item).result === 1) {
					if (AutoMule.getInfo() && AutoMule.getInfo().hasOwnProperty("torchMuleInfo")) {
						scriptBroadcast("muleTorch");
						//quit();
						scriptBroadcast("quit");
						//delay(10000);
					}

					return true;
				}
			} while (item.getNext());
		}

		return false;
	};

	// Check whether the killer is alone in the game
	this.aloneInGame = function () {
		var party = getParty();

		if (party) {
			do {
				if (party.name !== me.name) {
					return false;
				}
			} while (party.getNext());
		}

		return true;
	};

	// Try to lure a monster - wait until it's close enough
	this.lure = function (bossId) {
		var tick,
			unit = getUnit(1, bossId);

		if (unit) {
			tick = getTickCount();

			while (getTickCount() - tick < 2000) {
				if (getDistance(me, unit) <= 10) {
					return true;
				}

				delay(50);
			}
		}

		return false;
	};

	// Check if we have complete sets of organs
	this.completeSetCheck = function () {
		var horns = me.findItems("dhn"),
			brains = me.findItems("mbr"),
			eyes = me.findItems("bey");

		if (!horns || !brains || !eyes) {
			return false;
		}

		// We just need one set to make a torch
		if (Config.OrgTorch.MakeTorch) {
			return horns.length && brains.length && eyes.length;
		}

		return horns.length === brains.length && horns.length === eyes.length && brains.length === eyes.length;
	};

	// Get fade in River of Flames
	this.getFade = function () {
	if (Config.OrgTorch.GetFade && me.classid === 3) {  // If configured to get fade && Paladin
		if (!me.getState(159)) {    // If Fade is not already active                    
				print("Getting Fade");

			var switchItem = null;
			var item = me.getItem();
			
			if (item) {
				do {
					if (item.getPrefix(20653)) {    // Treachery
						switchItem = switchEquippedItem(copyUnit(item), 3);
						if(!switchItem) {  // Switch armor location
							print("Found Treachery but failed to switch");
							return false;
						} else if(switchItem.gid != item.gid) {
							print("Switched Treachery");
						} else {
							print("No need to switch items");
				}
						break;
					}

				} while (item.getNext());
			}
			
			if(!switchItem) {
				print("No suitable item found");
				return false;
			}
				
			
			Pather.useWaypoint(107);    // River of flame
			Precast.doPrecast(true);    // Cast BO and Holy Shield
			Pather.moveTo(7811, 5872);  // move into fire

			if (me.classid === 3 && me.getSkill(125, 1)) {  // if Paladin && Salvation
				Skill.setSkill(125, 0); // Use Salvation
			}

			while (!me.getState(159)) { // Until Fade is active
					delay(100);
				}

				print("Fade Achieved.");
			
			switchItem = switchEquippedItem(switchItem, 3);
			if(!switchItem) {  // Switch armor location
				print("Switching back to " + switchItem.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, "") + " failed");
				return false;
			} else if(switchItem.gid != item.gid) {
				print("Sucessfully switched back to " + switchItem.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, ""));
			}
			return true;
		}
	}

	return false;
};

this.switchEquippedItem = function (item, bodyLoc) {
	var itemLocation = -1;

	if(Item.canEquip(item)) { // Item exists and we can equip it
		switch(item.location) {
			
			case 1: // Item equipped self or merc
				if (item.bodylocation === bodyLoc) {  // self only.. merc does not count
					itemLocation = 1;
					return item;
				}
				break;
				
			case 7: // Item in stash
				itemLocation = 7;
				if (!Town.openStash()) {    // Go to stash and open
					return null;
			}
				break;
				
			case 6: // Item in cube
				itemLocation = 6;
				if (!Cubing.openCube()) {   // Go to cube and open (If cube is in stash, it will be handled automatically)
					return null;
		}
				break;
				
			case 3: // Item in inventory
				itemLocation = 3;
				break;

			case 0: // Item on ground
			case 2: // Item in belt (nonsense)
			case 4: // Item in store
			case 5: // Item in trade window
				break;
		}      
		
		//Can't deal with items on ground!
		if (item.mode === 3) {
			D2Bot.printToConsole(item.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, "") + " on ground.. no good :(", 9);
			return null;
		}
		
		//Other item already on the cursor.
		if (me.itemoncursor && item.mode !== 4) {
			print(item.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, "") + " already on cursor");
			return null;
		}
		
		D2Bot.printToConsole("Equipping: " + item.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, ""),9);
		
		//Attempt 3 times to pick to cursor if not already.
		for (i = 0; i < 3; i += 1) {
			if (item.toCursor()) {
				clickItem(0, bodyLoc);
				delay(me.ping * 2 + 500);

				if (item.bodylocation === bodyLoc) {
					if (getCursorType() === 3) {
						//Misc.click(0, 0, me);

						var cursorItem = getUnit(100);

						if (cursorItem) {
							switch(itemLocation) {
									
								case 3: // Item was in inventory
									if (!Storage.Inventory.CanFit(cursorItem) || !Storage.Inventory.MoveTo(cursorItem)) {
										cursorItem.drop();
									}
									break;
									
								case 6: // Item was in cube
									if (!Storage.Cube.CanFit(cursorItem) || !Storage.Cube.MoveTo(cursorItem)) {
										cursorItem.drop();
									}

									break;
									
								case 7: // Item was in stash
									if (!Storage.Stash.CanFit(cursorItem) || !Storage.Stash.MoveTo(cursorItem)) {
										cursorItem.drop();
									}
									break;
									
								case 0: // Item on the ground
								case 1: // Item equipped self or merc
								case 2: // Item in belt (nonsense)
								case 4: // Item in store
								case 5: // Item in trade window
								default:
									print("Oops, something went wrong placing " + cursorItem.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, "") + " to original location: " + itemLocation);
									break;
							}
						}
					}

					return copyUnit(cursorItem);
				}
			}
		}
	}

	return null;
	};

	// Open a red portal. Mode 0 = mini ubers, mode 1 = Tristram
	this.openPortal = function (mode) {
		var portal,
			item1 = mode === 0 ? me.findItem("pk1", 0) : me.findItem("dhn", 0),
			item2 = mode === 0 ? me.findItem("pk2", 0) : me.findItem("bey", 0),
			item3 = mode === 0 ?  me.findItem("pk3", 0) : me.findItem("mbr", 0);

		Town.goToTown(5);
		Town.doChores();

		if (Town.openStash() && Cubing.emptyCube()) {
			if (!Storage.Cube.MoveTo(item1) || !Storage.Cube.MoveTo(item2) || !Storage.Cube.MoveTo(item3)) {
				return false;
			}

			if (!Cubing.openCube()) {
				return false;
			}

			transmute();
			delay(1000);

			portal = getUnit(2, "portal");

			if (portal) {
				do {
					switch (mode) {
					case 0:
						if ([133, 134, 135].indexOf(portal.objtype) > -1 && this.doneAreas.indexOf(portal.objtype) === -1) {
							this.doneAreas.push(portal.objtype);

							return copyUnit(portal);
						}

						break;
					case 1:
						if (portal.objtype === 136) {
							return copyUnit(portal);
						}

						break;
					}
				} while (portal.getNext());
			}
		}

		return false;
	};

	// Do mini ubers or Tristram based on area we're already in
	this.pandemoniumRun = function () {
		var i, findLoc, skillBackup;

		Pather.makePortal();
		say("1");

		switch (me.area) {
		case 133: // Matron's Den
			Precast.doPrecast(true);
			Pather.moveToPreset(133, 2, 397, 2, 2, false);
			Attack.clear(5);
			Attack.kill(707);
			Pickit.pickItems();
			Town.goToTown();

			break;
		case 134: // Forgotten Sands
			Precast.doPrecast(true);

			findLoc = [20196, 8694, 20308, 8588, 20187, 8639, 20100, 8550, 20103, 8688, 20144, 8709, 20263, 8811, 20247, 8665];

			for (i = 0; i < findLoc.length; i += 2) {
				Pather.moveTo(findLoc[i], findLoc[i + 1], 3, false);
				delay(500);

				if (getUnit(1, 708)) {
					break;
				}
			}

			Attack.kill(708);
			Pickit.pickItems();
			Attack.clear();
			Town.goToTown();

			break;
		case 135: // Furnace of Pain
			Precast.doPrecast(true);
			Pather.moveToPreset(135, 2, 397, 2, 2, false);
			Attack.kill(706);
			Pickit.pickItems();
			Attack.clear();
			Town.goToTown();

			break;
		case 136: // Tristram
			Pather.moveTo(25068, 5078);
			Precast.doPrecast(true);

			findLoc = [25040, 5101, 25040, 5166, 25122, 5170];

			for (i = 0; i < findLoc.length; i += 2) {
				Pather.moveTo(findLoc[i], findLoc[i + 1]);
			}

			Skill.setSkill(125, 0);
			this.lure(704);
			Pather.moveTo(25129, 5198);
			Skill.setSkill(125, 0);
			this.lure(704);

			if (!getUnit(1, 704)) {
				Pather.moveTo(25122, 5170);
			}

			if (Config.OrgTorch.UseSalvation && me.classid === 3 && me.getSkill(125, 1)) {
				skillBackup = Config.AttackSkill[2];
				Config.AttackSkill[2] = 125;

				Attack.init();
			}

			Attack.kill(704);

			if (skillBackup && me.classid === 3 && me.getSkill(125, 1)) {
				Config.AttackSkill[2] = skillBackup;

				Attack.init();
			}

			Pather.moveTo(25162, 5141);
			delay(3250);

			if (!getUnit(1, 709)) {
				Pather.moveTo(25122, 5170);
			}

			Attack.kill(709);

			if (!getUnit(1, 705)) {
				Pather.moveTo(25122, 5170);
			}

			Attack.kill(705);
			Pickit.pickItems();
			this.checkTorch();
			Attack.clear();

			break;
		}
		say("2");
	};

	this.juvCheck = function () {
		var i,
			needJuvs = 0,
			col = Town.checkColumns(Storage.BeltSize());

		for (i = 0; i < 4; i += 1) {
			if (Config.BeltColumn[i] === "rv") {
				needJuvs += col[i];
			}
		}

		print("Need " + needJuvs + " juvs.");

		return needJuvs;
	};

	// Start
	var i, portal, tkeys, hkeys, dkeys, brains, eyes, horns, timer, farmer, busy, busyTick,
		neededItems = {pk1: 0, pk2: 0, pk3: 0, rv: 0};

	// Do town chores and quit if MakeTorch is true and we have a torch.
	this.checkTorch();

	// Wait for other bots to drop off their keys. This works only if TorchSystem.js is configured properly.
	if (Config.OrgTorch.WaitForKeys) {
		timer = getTickCount();

		// Check if current character is the farmer
		farmer = TorchSystem.isFarmer();

		this.torchSystemEvent = function (mode, msg) {
			var obj, farmer;

			if (mode === 6) {
				farmer = TorchSystem.isFarmer();

				if (farmer) {
					obj = JSON.parse(msg);

					if (obj) {
						switch (obj.name) {
						case "gameCheck":
							if (busy) {
								break;
							}

							if (farmer.KeyFinderProfiles.indexOf(obj.profile) > -1) {
								print("Got game request from: " + obj.profile);
								sendCopyData(null, obj.profile, 6, JSON.stringify({name: "gameName", value: {gameName: me.gamename, password: me.gamepassword}}));

								busy = true;
								busyTick = getTickCount();
							}

							break;
						case "keyCheck":
							if (farmer.KeyFinderProfiles.indexOf(obj.profile) > -1) {
								print("Got key count request from: " + obj.profile);

								// Get the number of needed keys
								neededItems = {pk1: 3 - tkeys, pk2: 3 - hkeys, pk3: 3 - dkeys, rv: this.juvCheck()};

								sendCopyData(null, obj.profile, 6, JSON.stringify({name: "neededItems", value: neededItems}));
							}

							break;
						}
					}
				}
			}
		};

		// Register event that will communicate with key hunters, go to Act 1 town and wait by stash
		addEventListener('copydata', this.torchSystemEvent);
		Town.goToTown(1);
		Town.move("stash");

		while (true) {

			// Abort if the current character isn't a farmer
			if (!farmer) {
				break;
			}

			// Free up inventory
			if (Town.needStash()) {
				Town.stash();
			}

			// Get the number keys
			tkeys = me.findItems("pk1", 0).length || 0;
			hkeys = me.findItems("pk2", 0).length || 0;
			dkeys = me.findItems("pk3", 0).length || 0;

			// Stop the loop if we  have enough keys or if wait time expired
			if (((tkeys >= 3 && hkeys >= 3 && dkeys >= 3) || (Config.OrgTorch.WaitTimeout && (getTickCount() - timer > Config.OrgTorch.WaitTimeout * 1000 * 60))) && this.aloneInGame()) {
				removeEventListener('copydata', this.torchSystemEvent);

				break;
			}

			if (busy) {
				while (getTickCount() - busyTick < 30000) {
					if (!this.aloneInGame()) {
						break;
					}

					delay(100);
				}

				if (getTickCount() - busyTick > 30000 || this.aloneInGame()) {
					busy = false;
				}
			}

			// Wait for other characters to leave
			while (!this.aloneInGame()) {
				delay(500);
			}

			delay(1000);

			// Pick the keys after the hunters drop them and leave the game
			Pickit.pickItems();
		}
	}

	// Count keys and organs
	tkeys = me.findItems("pk1", 0).length || 0;
	hkeys = me.findItems("pk2", 0).length || 0;
	dkeys = me.findItems("pk3", 0).length || 0;
	brains = me.findItems("mbr", 0).length || 0;
	eyes = me.findItems("bey", 0).length || 0;
	horns = me.findItems("dhn", 0).length || 0;

	// End the script if we don't have enough keys nor organs
	if ((tkeys < 3 || hkeys < 3 || dkeys < 3) && (brains < 1 || eyes < 1 || horns < 1)) {
		print("Not enough keys or organs.");

		return true;
	}

	Config.UseMerc = false;

	// We have enough keys, do mini ubers
	if (tkeys >= 3 && hkeys >= 3 && dkeys >= 3) {
		this.getFade();
		print("Making organs.");
		D2Bot.printToConsole("OrgTorch: Making organs.", 7);

		for (i = 0; i < 3; i += 1) {
			// Abort if we have a complete set of organs
			// If Config.OrgTorch.MakeTorch is false, check after at least one portal is made
			if ((Config.OrgTorch.MakeTorch || i > 0) && this.completeSetCheck()) {
				break;
			}

			portal = this.openPortal(0);

			if (portal) {
				Pather.usePortal(null, null, portal);
			}

			this.pandemoniumRun();
		}
	}

	// Don't make torches if not configured to OR if the char already has one
	if (!Config.OrgTorch.MakeTorch || this.checkTorch()) {
		return true;
	}

	// Count organs
	brains = me.findItems("mbr", 0).length || 0;
	eyes = me.findItems("bey", 0).length || 0;
	horns = me.findItems("dhn", 0).length || 0;

	// We have enough organs, do Tristram
	if (brains && eyes && horns) {
		this.getFade();
		print("Making torch");
		D2Bot.printToConsole("OrgTorch: Making torch.", 7);

		portal = this.openPortal(1);

		if (portal) {
			Pather.usePortal(null, null, portal);
		}

		this.pandemoniumRun();
	}

	return true;
}