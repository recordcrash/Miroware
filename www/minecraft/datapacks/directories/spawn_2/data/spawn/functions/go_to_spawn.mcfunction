execute at @s run function back:set_back
summon minecraft:area_effect_cloud ~ ~ ~ {Tags:["spawn.destination"]}
function spawn:offset_up
execute if block ~ ~ ~ #spawn:passable run function spawn:offset_down
kill @e[type=minecraft:area_effect_cloud,tag=spawn.destination]