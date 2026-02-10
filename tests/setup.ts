// Vitest global setup
// Sets CWD to project root for file-reading tests
import * as path from 'path'

const projectRoot = path.resolve(__dirname, '..')
process.chdir(projectRoot)
