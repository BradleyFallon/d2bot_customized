/**
*	@filename	TorchSystem.js
*	@author		kolton
*	@desc		Works in conjunction with OrgTorch script. Allows the uber killer to get keys from other profiles.
*/

var TorchSystem = {
	FarmerProfiles: {
// ############################ S E T U P ##########################################

		/* Each uber killer profile can have their own army of key finders
			Multiple entries are separated with a comma
			Example config:

			"Farmer 1": { // Farmer profile name
				// Put key finder profiles here. Example - KeyFinderProfiles: ["MF 1", "MF 2"],
				KeyFinderProfiles: ["mf 1", "mf 2"],

				// Put the game name of uber killer here (without numbers). Key finders will join this game to drop keys. Example - FarmGame: "Ubers-",
				FarmGame: "torch1-"
			},

			"Farmer 2": { // Farmer profile name
				// Put key finder profiles here. Example - KeyFinderProfiles: ["MF 1", "MF 2"],
				KeyFinderProfiles: ["mf 3", "mf 4"],

				// Put the game name of uber killer here (without numbers). Key finders will join this game to drop keys. Example - FarmGame: "Ubers-",
				FarmGame: "torch2-"
			}
		*/

		// Edit here!

		"smiter": { // Farmer profile name
			// Put key finder profiles here. Example - KeyFinderProfiles: ["MF 1", "MF 2"],
			KeyFinderProfiles: ["USWestSorc"],

			// Put the game name of uber killer here (without numbers). Key finders will join this game to drop keys. Example - FarmGame: "Ubers-",
			FarmGame: "sktfarm"
		}

// #################################################################################
	},

	// Don't touch
	inGame: false,
	check: false,

	// This is how a key-finder checks for what organ-farmers are I belong to
	getFarmers: function () {
		var i, j,
			list = [];

		// For each farmer profile index
		for (i in this.FarmerProfiles) {
			// Verify there is still a value at index 
			if (this.FarmerProfiles.hasOwnProperty(i)) {
				// For each finder profile index
				for (j = 0; j < this.FarmerProfiles[i].KeyFinderProfiles.length; j += 1) {
					// If I am the key finder
					if (this.FarmerProfiles[i].KeyFinderProfiles[j].toLowerCase() === me.profile.toLowerCase()) {
						this.FarmerProfiles[i].profile = i;

						// Add this farmer profile to list
						list.push(this.FarmerProfiles[i]);
					}
				}
			}
		}

		// Return 
		if (list.length) {
			return list;
		}

		return false;
	},

	isFarmer: function () {
		if (this.FarmerProfiles.hasOwnProperty(me.profile)) {
			this.FarmerProfiles[me.profile].profile = me.profile;

			return this.FarmerProfiles[me.profile];
		}

		return false;
	},

	/*inGameCheck: function () {
		var i, j, farmers, dropArray, item,
			keyIds = ["pk1", "pk2", "pk3"];

		farmers = this.getFarmers();

		if (!farmers) {
			return false;
		}

		for (i = 0; i < farmers.length; i += 1) {
			if (farmers[i].FarmGame.length > 0 && me.gamename.toLowerCase().match(farmers[i].FarmGame.toLowerCase())) {
				print("ÿc4Torch Systemÿc0: In Farm game.");
				D2Bot.printToConsole("Torch System: In Farm game.", 7);
				Town.goToTown(1);

				if (!Town.openStash()) {
					return false;
				}

				while (true) {
					// Reset array
					dropArray = [];

					// Search for one of each key and put them in drop array
					for (j = 0; j < 3; j += 1) {
						// Find a key (one type per cycle)
						item = me.getItem(keyIds[j]);

						// Build an array of keys to drop
						if (item) {
							dropArray.push(copyUnit(item));
						}
					}

					// Abort if there's no complete sets of keys
					if (dropArray.length !== 3) {
						break;
					}

					// Drop a keyset
					for (j = 0; j < 3; j += 1) {
						dropArray[j].drop();
					}
				}

				delay(5000);
				quit();
				delay(10000);

				return true;
			}
		}

		return false;
	},*/

	// This is how the mfer drops off keys for farmer when in a farmer's game
	inGameCheck: function () {
		var i, j, neededItems,
			farmers = this.getFarmers();

		if (!farmers) {
			return false;
		}

		// For each farmer profile
		for (i = 0; i < farmers.length; i += 1) {
			// If farmer profile has game name defined && I am in that game
			if (farmers[i].FarmGame.length > 0 && me.gamename.toLowerCase().match(farmers[i].FarmGame.toLowerCase())) {
				print("ÿc4Torch Systemÿc0: In Farm game.");
				D2Bot.printToConsole("Torch System: Transfering keys.", 7);
				D2Bot.updateStatus("Torch System: In game.");
				Town.goToTown(1);

				
				if (Town.openStash()) {
					// Ask the farmer what they need
					neededItems = this.keyCheck();

					// Drop off anything I have that the farmer needs
					if (neededItems) {
						for (i in neededItems) {
							if (neededItems.hasOwnProperty(i)) {
								while (neededItems[i].length) {
									neededItems[i].shift().drop();
								}
							}
						}
					}
				}

				if (me.getStat(14) >= 100000) {
					gold(100000);
				}

				delay(5000);
				quit();
				//delay(10000);

				return true;
			}
		}

		return false;
	},

	// This is how the key-finder checks if they have any items needed by organ-farmers
	keyCheck: function () {
		var i,
			neededItems = {},
			farmers = this.getFarmers(),
			did_check = false;

		if (!farmers) {
			return false;
		}

		// This is an event handler
		// If there is a message received which is the items needed by a farmer
		// Then check inventory to see if I have any of those items.
		// If I have any needed items, add them to the neededItems object
		function keyCheckEvent(mode, msg) {
			var i, j, obj, item;

			if (mode === 6) {
				obj = JSON.parse(msg);

				if (obj.name === "neededItems") {
					did_check = true;
					for (i in obj.value) {
						// For each dict-key [name of a needed item] which has a non-null value
						if (obj.value.hasOwnProperty(i) && obj.value[i] > 0) {
							// Check if I have the item described at that in that dict-key
							switch (i) {
							case "pk1":
							case "pk2":
							case "pk3":
								item = me.getItem(i);


								if (item) {
									do {
										if (!neededItems[i]) {
											neededItems[i] = [];
										}

										neededItems[i].push(copyUnit(item));

										if (neededItems[i].length >= obj.value[i]) {
											break;
										}
									} while (item.getNext());
								}

								break;
							case "rv":
								item = me.getItem();

								if (item) {
									do {
										if (item.code === "rvs" || item.code === "rvl") {
											if (!neededItems[i]) {
												neededItems[i] = [];
											}

											neededItems[i].push(copyUnit(item));

											if (neededItems[i].length >= Math.min(2, obj.value[i])) {
												break;
											}
										}
									} while (item.getNext());
								}

								break;
							}
						}
					}
				}
			}
		}

		addEventListener("copydata", keyCheckEvent);

		// TODO: one mfer for multiple farmers handling

		// Customized
		// I want my organ-farmers to also do other things and not just wait for keys.
		// My organ-farmer is a hybrid build that can run cows/chaos/baal etc. and ubers
		// If my organ-farmer is busy doing other things when the key-finders try to check in
		// then they dont communicate. For this reason, I want to have potentially long waits for check-in
		// However, once information is exchanged, I want the wait to stop.
		// This mamkes more sense when putting the waiting on the key-finder and not the organ-farmer

		// I want this to try for N minutes, to improve chances.
		// My organ-farmer profile does more than just organ-farming,
		// if the time per run is 15 minutes, and the waitforkeys time is 3 minutes, there would randomly be a 1/5 chance of interaction
		// This is not really random though, if key-finder games are 14 minutes, the alignment can be out of phase for a long period of time
		// By increasing the time window by 2 minutes for the key-finder pings, there is more opportunity for alignment. 
		// I am thinking that the farmer-wait and finder-wait should total more than half of the farmer's game length
		var elapsed = 0;
		// Decided to go with 10 minutes because I want the key-finder to be the one who waits until an organ-farmer is ready
		// With this strategy, it makes sense for the wait time on the organ farmer to be very small, e.g. 2 minutes
		// The organ-farmer should just need time to broadcast need and wait for key-farmer to join the game.
		// The key-farmer has a potentially long wait, but only as needed.
		var timeout = 10 * 1000 * 60
		// Keep trying to check if I have needed keys until I get any response or timeout 
		// Can deliver to multiple farmers if ready at same time, but will not wait after first farmer is ready
		while (elapsed < timeout && !did_check) {
			// For each farmer
			for (i = 0; i < farmers.length; i += 1) {
					// Send out a message, requesting that organ-farmers respond with a needed items list
				sendCopyData(null, farmers[i].profile, 6, JSON.stringify({name: "keyCheck", profile: me.profile}));

					// The event listener is running, and looking for responses from organ-farmers
					// Give it a sec to do its thing
				delay(250);

					// If there are any pandemonium keys in my items needed by organ-farmers
					// Then return needed items. (This means rejuvs alone will not trigger an exchange)
				if (neededItems.hasOwnProperty("pk1") || neededItems.hasOwnProperty("pk2") || neededItems.hasOwnProperty("pk3")) {
					removeEventListener("copydata", keyCheckEvent);

					return neededItems;
				}
			}
		}

		removeEventListener("copydata", keyCheckEvent);

		return false;
	},


	// This is how a key-finder checks if they should join a game with an organ-farmer
	outOfGameCheck: function () {
		if (!this.check) {
			return false;
		}

		this.check = false;

		var i, game, farmers;

		// This event will set the game name provided by an organ-farmer who is waiting for keys
		function CheckEvent(mode, msg) {
			var i, obj,
				farmers = TorchSystem.getFarmers();

			if (mode === 6) {
				obj = JSON.parse(msg);

				if (obj && obj.name === "gameName") {
					for (i = 0; i < farmers.length; i += 1) {
						if (obj.value.gameName.toLowerCase().match(farmers[i].FarmGame.toLowerCase())) {
							game = [obj.value.gameName, obj.value.password];
						}
					}
				}
			}

			return true;
		}

		// Check if there are any active organ-farmers who I work for
		farmers = this.getFarmers();

		if (!farmers) {
			return false;
		}

		// Ask if any farmers are waiting for keys, and listen for response. First response with a game name wins the loot
		addEventListener('copydata', CheckEvent);


		for (i = 0; i < farmers.length; i += 1) {
			sendCopyData(null, farmers[i].profile, 6, JSON.stringify({name: "gameCheck", profile: me.profile}));
			delay(500);

			if (game) {
				break;
			}
		}

		removeEventListener('copydata', CheckEvent);

		// If a game was reported by a waiting organ-farmer, join the game
		// (once in game, then farmer and finder will communicate and exchange keys if needed)
		if (game) {
			//D2Bot.printToConsole("Joining key drop game.", 7);
			delay(2000);

			this.inGame = true;
			me.blockMouse = true;

			joinGame(game[0], game[1]);

			me.blockMouse = false;

			// At this point, the key-finder has been sent into a game with a waiting organ-farmer
			// Once this key-finder is in game, the ingame script loader will recognize it is time to exchange keys
			delay(5000);


			while (me.ingame) {
				delay(1000);
			}

			this.inGame = false;

			return true;
		}

		return false;
	}
};