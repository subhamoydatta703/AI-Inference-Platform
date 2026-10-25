import pLimit from "p-limit";



export const queryConcurrencyLimiter = pLimit({concurrency: 1});