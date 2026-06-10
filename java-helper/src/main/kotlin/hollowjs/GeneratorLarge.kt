package hollowjs

import com.netflix.hollow.api.producer.HollowProducer
import com.netflix.hollow.api.producer.fs.HollowFilesystemPublisher
import com.netflix.hollow.core.write.objectmapper.HollowPrimaryKey
import java.io.File

fun main() {
    val publishDir = File("/Users/ygraber/git/github/yonatang/hollow-js/lib/tests/snapshots")

    val publisher = HollowFilesystemPublisher(publishDir.toPath())
    val producer = HollowProducer.withPublisher(publisher).build()
    producer.initializeDataModel(GeneratorLarge.Person::class.java)

    val cities = listOf(
        "London", "Paris", "New York", "Tel Aviv", "Tokyo", "Berlin", "Sydney", "Toronto",
        "Dubai", "Singapore", "Amsterdam", "Madrid", "Rome", "Seoul", "Mumbai", "São Paulo",
        "Mexico City", "Cairo", "Bangkok", "Istanbul", "Zurich", "Vienna", "Stockholm", "Oslo",
        "Helsinki", "Warsaw", "Prague"
    )

    val tagPool = listOf(
        "vip", "premium", "new", "active", "verified", "subscriber", "trial", "enterprise",
        "beta", "legacy", "internal", "external", "admin", "readonly", "pending", "suspended",
        "churned", "referral", "partner", "influencer", "student", "developer", "tester",
        "early_adopter", "loyalty", "opted_out", "high_value"
    )

    val tagKeys = listOf(
        "color", "tier", "source", "region", "lang", "country", "currency", "platform",
        "device", "os", "browser", "channel", "campaign", "segment", "cohort", "plan",
        "billing_cycle", "signup_method", "referrer", "timezone", "industry", "company_size",
        "role", "department", "age_group"
    )

    producer.runCycle { cycle ->
        val random = java.util.Random(42)

        for (i in 0 until 5_000_000) {
            val actor = GeneratorLarge.Person().apply {
                id = 10000 + i
                name = "Person ${10000 + i}"

                val numCities = random.nextInt(cities.size + 1)
                this.cities = cities.shuffled(random).take(numCities)

                val numTags = random.nextInt(tagPool.size + 1)
                tags = tagPool.shuffled(random).take(numTags).toHashSet()

                val numTagMapEntries = random.nextInt(tagKeys.size + 1)
                tagMap = tagKeys.shuffled(random).take(numTagMapEntries)
                    .associateWith { "value${random.nextInt(100)}" }
                    .toMutableMap()
            }
            cycle.add(actor)
        }
    }
}

object GeneratorLarge {
    @HollowPrimaryKey(fields = ["id"])
    class Person {
        @JvmField var id: Int = 0
        @JvmField var name: String? = null
        @JvmField var cities: List<String>? = null
        @JvmField var tags: Set<String>? = null
        @JvmField var tagMap: Map<String, String>? = null
    }
}