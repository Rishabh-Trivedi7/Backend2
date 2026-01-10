const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
         Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}
 



export {asyncHandler}


//higher order function : which can take function as input and return as well

//understand syntax step by step:
//1. const asyncHandler = () => {}
//2. const asyncHandler = (func) => {}
//3. const asyncHandler = (func) => {() => {} }
//4. remove {}
//5. const asyncHandler = (func) => async() => {await}




// const asyncHandler = (fn) => async(req,res,next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success : true,
//             message : err.message
//         })
//     }
// }
