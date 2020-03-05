/**
 * This is stand alone component showing sensor data only. 
 * Eventually it will grow to show more data.
 */
export default {
    props: ["spot"],
    data: () => ({
       
    }),
    created: function () {
    },
    methods : {
        formatNumber : function(num){
            return Number(num).toFixed(1);
        },
        closeIt : function(){
            this.$emit('close');
        }
    }
};