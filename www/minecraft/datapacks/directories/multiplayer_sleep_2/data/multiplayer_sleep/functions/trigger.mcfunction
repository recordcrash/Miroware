execute if score @s mulSle matches 1 run function multiplayer_sleep:info_1
execute if score @s mulSle matches 2 run function multiplayer_sleep:info_2
execute if score @s mulSle matches 3 run function multiplayer_sleep:info_3
execute if score @s mulSle matches 4 run function multiplayer_sleep:preview_1
execute if score @s mulSle matches 5 run function multiplayer_sleep:preview_2
tellraw @s[scores={mulSle=6}] [{"text":"Player","color":"aqua"},{"text":" is now sleeping. 1 of 2 player(s) asleep","color":"dark_aqua"}]
scoreboard players set @s mulSle 0