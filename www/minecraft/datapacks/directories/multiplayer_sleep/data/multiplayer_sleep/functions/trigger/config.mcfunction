tellraw @s {"text":"                                                                                ","color":"dark_gray","strikethrough":true}
tellraw @s ["                Multiplayer Sleep",{"text":" / ","color":"gray"},"Personal Settings                "]
tellraw @s {"text":"                                                                                ","color":"dark_gray","strikethrough":true}
execute if score @s mpSleep.config matches 0.. run function multiplayer_sleep:trigger/show_disabled_display_default
execute unless score @s mpSleep.config matches 0.. run function multiplayer_sleep:trigger/show_enabled_display_default
execute if score @s mpSleep.config matches 1 run tellraw @s ["",{"text":"[ ✔ ]","color":"green","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 7"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to disable ","color":"red"},"Display: Boss Bar",{"text":".","color":"red"}]}}," ",{"text":"[ ℹ ]","color":"gray","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 4"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to preview ","color":"gray"},"Display: Boss Bar",{"text":".\nThe boss bar preview's color may not be accurate.","color":"dark_gray"}]}}," Display: Boss Bar"]
execute unless score @s mpSleep.config matches 1 run tellraw @s ["",{"text":"[ ❌ ]","color":"red","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 8"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to enable ","color":"green"},"Display: Boss Bar",{"text":".","color":"green"}]}}," ",{"text":"[ ℹ ]","color":"gray","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 4"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to preview ","color":"gray"},"Display: Boss Bar",{"text":".\nThe boss bar preview's color may not be accurate.","color":"dark_gray"}]}}," Display: Boss Bar"]
execute if score @s mpSleep.config matches 2 run tellraw @s ["",{"text":"[ ✔ ]","color":"green","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 7"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to disable ","color":"red"},"Display: Action Bar",{"text":".","color":"red"}]}}," ",{"text":"[ ℹ ]","color":"gray","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 5"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to preview ","color":"gray"},"Display: Action Bar",{"text":".","color":"gray"}]}}," Display: Action Bar"]
execute unless score @s mpSleep.config matches 2 run tellraw @s ["",{"text":"[ ❌ ]","color":"red","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 9"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to enable ","color":"green"},"Display: Action Bar",{"text":".","color":"green"}]}}," ",{"text":"[ ℹ ]","color":"gray","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 5"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to preview ","color":"gray"},"Display: Action Bar",{"text":".","color":"gray"}]}}," Display: Action Bar"]
execute if score @s mpSleep.config matches 3 run tellraw @s ["",{"text":"[ ✔ ]","color":"green","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 7"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to disable ","color":"red"},"Display: Chat",{"text":".","color":"red"}]}}," ",{"text":"[ ℹ ]","color":"gray","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 6"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to preview ","color":"gray"},"Display: Chat",{"text":".","color":"gray"}]}}," Display: Chat"]
execute unless score @s mpSleep.config matches 3 run tellraw @s ["",{"text":"[ ❌ ]","color":"red","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 10"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to enable ","color":"green"},"Display: Chat",{"text":".","color":"green"}]}}," ",{"text":"[ ℹ ]","color":"gray","clickEvent":{"action":"run_command","value":"/trigger mpSleep set 6"},"hoverEvent":{"action":"show_text","value":["",{"text":"Click to preview ","color":"gray"},"Display: Chat",{"text":".","color":"gray"}]}}," Display: Chat"]
tellraw @s {"text":"                                                                                ","color":"dark_gray","strikethrough":true}