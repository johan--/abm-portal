import DS from 'ember-data';

export default DS.Model.extend({
  content: DS.attr(),

  sighting: DS.belongsTo('sighting')
});
