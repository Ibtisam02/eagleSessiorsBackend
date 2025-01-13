class ApiFeatures{
    constructor(query,queryStr){
        this.query=query,
        this.queryStr=queryStr
    }

    search(){
        const keyword=this.queryStr.keyword?{
            name:{
                $regex:this.queryStr.keyword,
                $options:"i"
            }
        }:{};
        console.log(this.queryStr.sort=="asc")

        if (this.queryStr.sort=="asc" || this.queryStr.sort=="desc") {
            if (this.queryStr.sort=="asc") {
                console.log("asc")
                this.query=this.query.find({...keyword}).sort({basePprice:1});
            }
            else if (this.queryStr.sort=="desc") {
                console.log("desc")
                this.query=this.query.find({...keyword}).sort({basePprice:-1});
            }
            else{
                console.log("simple")
                this.query=this.query.find({...keyword}).sort({basePprice:1});
            }
        }
        else{
            if (this.queryStr.sort=="aToz") {
                this.query=this.query.find({...keyword}).sort({name:1});
            }
            else if (this.queryStr.sort=="zToa") {
                this.query=this.query.find({...keyword}).sort({name:-1});
            }
            else{
                this.query=this.query.find({...keyword}).sort({name:1});
            }
        }
        
        
        
        return this
    }
    filter(){
        const queryCopy={...this.queryStr};
        const removeFields=["keyword","page","limit","resultsPerPage","sort"];
        
        removeFields.forEach((item)=>delete queryCopy[item])
        let queryStr=JSON.stringify(queryCopy)
        queryStr=queryStr.replace(/\b(gt|gte|lt|lte)\b/g,(key)=>`$${key}`)
        
        this.query=this.query.find(JSON.parse(queryStr));
        console.log(this.queryStr);
        
        return this
    }

    pagination(){
        let resutlPerPage=Number(this.queryStr.resultsPerPage) ||20;
        let currentPage=Number(this.queryStr.page) || 1;
        let skip=resutlPerPage*(currentPage-1)
        this.query=this.query.limit(resutlPerPage).skip(skip)
        return this
    }
}

export default ApiFeatures