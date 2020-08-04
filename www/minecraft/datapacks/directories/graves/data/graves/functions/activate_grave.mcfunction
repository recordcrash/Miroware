tag @s add graves.subject
execute store result score #activated graves.dummy run data get entity @s SelectedItem.tag.gravesData.id
execute as @e[type=minecraft:armor_stand,tag=graves.hitbox] run function graves:check_hitbox
execute if score #robbing graves.config matches 0 unless data entity @e[type=minecraft:armor_stand,tag=graves.activated,limit=1] ArmorItems[{tag:{gravesKey:1b}}] run function graves:check_owner
execute as @e[type=minecraft:armor_stand,tag=graves.activated] run function graves:fix_equipment/all
execute as @e[type=minecraft:armor_stand,tag=graves.activated] at @s run function graves:open_grave
clear @s minecraft:stone_button{gravesData:{}}
tag @s remove graves.subject