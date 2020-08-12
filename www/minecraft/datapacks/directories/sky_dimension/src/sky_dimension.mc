function uninstall {
	schedule clear sky_dimension:tick
}
clock 1t {
	name tick
	execute as @e[type=#sky_dimension:teleportable] at @s run {
		name tick_entity
		execute if predicate sky_dimension:overworld_sky in sky_dimension:dimension run tp @s ~ 4 ~
		execute if predicate sky_dimension:sky_dimension_void in minecraft:overworld run tp @s ~ 256 ~
	}
}
