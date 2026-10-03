import { HiBookOpen, HiClock, HiCheckCircle } from "react-icons/hi2"
import { Card, CardContent } from "@/components/dev/card"

interface SyllabusItem {
  week: number
  title: string
  topics: string[]
  duration: string
}

interface ClassSyllabusProps {
  syllabus: SyllabusItem[]
}

export function ClassSyllabus({ syllabus }: ClassSyllabusProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <HiBookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Syllabus</h2>
          <p className="text-gray-600">Complete curriculum breakdown</p>
        </div>
      </div>

      <div className="space-y-4">
        {syllabus.map((item, index) => (
          <Card
            key={index}
            className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-gray-50 to-gray-100/50"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{item.week}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <HiClock className="w-4 h-4 mr-1" />
                      {item.duration}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <HiCheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="ml-16">
                <div className="grid gap-3">
                  {item.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-2 h-2 bg-gradient-to-r from-primary to-primary/60 rounded-full mr-3" />
                      <span className="text-gray-700 font-medium">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
