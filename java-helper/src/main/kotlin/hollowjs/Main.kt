package hollowjs

import com.netflix.hollow.core.memory.MemoryMode
import com.netflix.hollow.core.read.HollowBlobInput
import com.netflix.hollow.core.read.engine.HollowBlobReader
import com.netflix.hollow.core.read.engine.HollowReadStateEngine
import com.netflix.hollow.tools.stringifier.HollowRecordJsonStringifier
import java.io.File
import java.io.StringWriter
import java.util.logging.Level
import java.util.logging.Logger

fun main(vararg args: String) {
    Logger.getLogger("com.netflix.hollow.core.read.engine.HollowBlobReader").setLevel(Level.OFF)
    val file = args[0]
    val type = args.getOrNull(1)
    val ordinal = args.getOrNull(2)?.toIntOrNull()

//    val file = "/Users/ygraber/git/github/yonatang/hollow-js/demo/binaries/ums/content"
    HollowBlobInput.randomAccess(File(file)).use {
        val rse = HollowReadStateEngine()
        val hbr = HollowBlobReader(rse, MemoryMode.SHARED_MEMORY_LAZY)
        hbr.readSnapshot(it)
        when {
            type == null -> {
                rse.typeStates.forEach { type ->
                    println(type.schema)
                    println("Cardinality: " + type.populatedOrdinals.cardinality())
                    println("Num Shards: " + type.numShards())
                    println()
                }
            }

            ordinal == null -> {
                val typeState = rse.getTypeState(type) ?: throw IllegalArgumentException("Unknown type $type")
                println(typeState.schema)
                println("Cardinality: " + typeState.populatedOrdinals.cardinality())
                println("Num Shards: " + typeState.numShards())
            }

            else -> {
                val typeState = rse.getTypeState(type) ?: throw IllegalArgumentException("Unknown type $type")
                val stringifier = HollowRecordJsonStringifier(true, true)

                val stringWriter = StringWriter()
                stringifier.stringify(stringWriter, rse, typeState.schema.name, ordinal)
                println(stringWriter.toString())
            }
        }
    }

}