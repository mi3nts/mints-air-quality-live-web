import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

/** http://mcg.mbitson.com/#!?mcgpalette0=%23064a56 */
export default new Vuetify({
  icons: {
    iconfont: 'mdi',
  },
  options: {
    customProperties: true
  },
  theme: {
    themes: {
      light: {
        primary: Object.freeze({
          base: '#38b5e6',
          lighten5: '#E7F6FC',
          lighten4: '#C3E9F8',
          lighten3: '#9CDAF3',
          lighten2: '#74CBEE',
          lighten1: '#56C0EA',
          darken1: '#32AEE3',
          darken2: '#2BA5DF',
          darken3: '#249DDB',
          darken4: '#178DD5',
          accent1: '#FFFFFF',
          accent2: '#D4EDFF',
          accent3: '#A1D9FF',
          accent4: '#87CEFF'
        }),
        secondary: Object.freeze({
          base: '#c3ef21',
          lighten5: '#F8FDE4',
          lighten4: '#EDFABC',
          lighten3: '#E1F790',
          lighten2: '#D5F464',
          lighten1: '#CCF142',
          darken1: '#BDED1D',
          darken2: '#B5EB18',
          darken3: '#AEE814',
          darken4: '#A1E40B',
          accent1: '#FFFFFF',
          accent2: '#F3FFDB',
          accent3: '#E1FFA8',
          accent4: '#D9FF8F'
        })
      }
    }
  }

});