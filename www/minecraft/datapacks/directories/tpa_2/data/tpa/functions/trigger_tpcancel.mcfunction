execute unless score @s tpa.target matches 1.. run tellraw @s {"text":"You have no active teleport requests to cancel.","color":"red"}
execute if score @s tpa.target matches 1.. run function tpa:cancel_tpa