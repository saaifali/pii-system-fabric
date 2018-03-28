'use strict';
/**
 * Write your transction processor functions here
 */


/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * A Member grants access to their record to another Member.
 * @param {org.cse.piinet.AuthorizeAccess} authorize - the authorize to be processed
 * @transaction
 */
function authorizeAccess(authorize) {

    var me = getCurrentParticipant();
    console.log('**** AUTH: ' + me.getIdentifier() + ' granting access to ' + authorize.memberId );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is not already authorized, we authorize them
    var index = -1;

    if(!me.authorized) {
        me.authorized = [];
    }
    else {
        index = me.authorized.indexOf(authorize.memberId);
    }

    if(index < 0) {
        me.authorized.push(authorize.memberId);

        return getParticipantRegistry('org.cse.piinet.Member')
        .then(function (memberRegistry) {

            // emit an event
            var event = getFactory().newEvent('org.cse.piinet', 'MemberEvent');
            event.memberTransaction = authorize;
            emit(event);

            // persist the state of the member
            return memberRegistry.update(me);
        });
    }
}

/**
 * A Member revokes access to their record from another Member.
 * @param {org.cse.piinet.RevokeAccess} revoke - the RevokeAccess to be processed
 * @transaction
 */
function revokeAccess(revoke) {

    var me = getCurrentParticipant();
    console.log('**** REVOKE: ' + me.getIdentifier() + ' revoking access to ' + revoke.memberId );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is authorized, we remove them
    var index = me.authorized ? me.authorized.indexOf(revoke.memberId) : -1;

    if(index>-1) {
        me.authorized.splice(index, 1);

        return getParticipantRegistry('org.cse.piinet.Member')
        .then(function (memberRegistry) {

            // emit an event
            var event = getFactory().newEvent('org.cse.piinet', 'MemberEvent');
            event.memberTransaction = revoke;
            emit(event);

            // persist the state of the member
            return memberRegistry.update(me);
        });
    }
}

/**
 * Sample transaction processor function.
 * @param {org.cse.piinet.GetData} Tx The sample transaction instance.
 * @transaction
 */
function GetData(Tx) {
    console.log('**** Entered GetData Transaction by: ' + getCurrentParticipant().getIdentifier() + '!' );

    // Save the old value of the asset.
    var requester = Tx.RequestingMember;
    var asset = Tx.RequestedAsset;
    requester.dump="The Requester is not authorized!";
    var authorized = asset.owner.authorized;
    if (authorized.indexOf(requester.getIdentifier())==-1) {
       requester.dump="The Requester is not authorized!";
    }
    else {
        console.log('**** Checked Authorized part of Member!');
        var address = "";
        if (asset.address)
        {
            address = asset.address.house+", "+asset.address.street+", "+asset.address.city+", "+asset.address.county+", "+asset.address.country + "-"+ asset.address.zip;    
        }
        
        var name = asset.firstName+" "+asset.lastName;
        var dob = "";
        if (asset.dob)
        {
            dob = asset.dob;
        }
        var CompiledData = {
            "name":name,
            "address":address,
            "dob":dob
        }
        CompiledData = JSON.stringify(CompiledData)
        // Update the asset with the new value.
        requester.dump = CompiledData;
    }
    // Get the asset registry for the asset.
    return getParticipantRegistry('org.cse.piinet.Member')
        .then(function (memberRegistry) {

            // Update the asset in the asset registry.
            return memberRegistry.update(requester);

        });
    console.log('**** Updated dump!');

}