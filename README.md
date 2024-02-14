# spellingtiff

NYT Crossword and Spelling Bee rewrites because I didn't want to buy a subscription when my mom already has one. It's also not quite as cool to share accounts with your mom, so I serve this myself.

requires .env file with the following:
```bash
USERNAME={username}
PASSWORD={password}
```
where username is the username of an NTY account and password is the password of a NYT account. I can put this online because you have to have a username and password already in order to run this service.

Comes with an API for scraping the crossword and the spelling bee daily (but only upon request), crossword and spelling bee game mirror things and other cool features like literally nothing else. That's literally it. It's just the crossword and the spelling bee but I serve it instead of NYT.

TODOs:
- [ ] better homepage
- [ ] better visuals for crossword
- [ ] previous days' stuff
- [ ] better modularity in game scripts god please just seperate them why is the crossword one 550 lines long please stop this why
